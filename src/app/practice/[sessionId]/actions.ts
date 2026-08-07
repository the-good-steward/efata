"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  transcribeAudio,
  countFillers,
  scriptOverlap,
} from "@/lib/transcribe";
import {
  evaluateAnswer,
  currentEvalModel,
  type Rubric,
} from "@/lib/evaluation/evaluate";
import { checkAnswerLimit, type Tier } from "@/lib/limits";
import { recordFailure } from "@/lib/failures";

export type AnswerState = { error?: string; ok?: boolean };

const MAX_BYTES = 25 * 1024 * 1024;

export async function submitAnswer(
  _prev: AnswerState,
  formData: FormData,
): Promise<AnswerState> {
  const sessionQuestionId = String(formData.get("session_question_id") ?? "");
  const audio = formData.get("audio");

  if (!sessionQuestionId) return { error: "Missing question reference." };
  if (!(audio instanceof File) || audio.size === 0) {
    return { error: "No recording was received. Try recording again." };
  }
  if (audio.size > MAX_BYTES) {
    return { error: "That recording is too long. Keep answers under two minutes." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  const limit = await checkAnswerLimit(
    supabase,
    user.id,
    (profile?.tier ?? "free") as Tier,
  );
  if (!limit.allowed) return { error: limit.message };

  // Ownership is enforced by RLS on sessions, so a row only comes back
  // if this session_question belongs to the caller.
  const { data: link } = await supabase
    .from("session_questions")
    .select("id, session_id, questions (id, body, rubric, context, source)")
    .eq("id", sessionQuestionId)
    .maybeSingle();

  if (!link) return { error: "That question isn't part of one of your sessions." };

  const question = link.questions as unknown as {
    id: string;
    body: string;
    rubric: Rubric;
    context: string | null;
    source: string;
  } | null;

  if (!question) return { error: "That question could not be loaded." };

  // Attempt number drives the retry loop: attempt 2 is compared against
  // attempt 1 so the person can hear what changed.
  const { data: previous } = await supabase
    .from("attempts")
    .select("attempt_number, transcript, improved_answer")
    .eq("session_question_id", sessionQuestionId)
    .order("attempt_number", { ascending: false })
    .limit(1);

  const attemptNumber = (previous?.[0]?.attempt_number ?? 0) + 1;
  const previousTranscript = previous?.[0]?.transcript ?? null;
  const previousRewrite = previous?.[0]?.improved_answer ?? null;

  let transcript;
  try {
    transcript = await transcribeAudio(
      await audio.arrayBuffer(),
      audio.type || "audio/webm",
    );
  } catch (error) {
    await recordFailure({
      userId: user.id,
      stage: "transcription",
      error,
      context: {
        audioBytes: audio.size,
        audioType: audio.type || "unknown",
        sessionQuestionId,
        attemptNumber,
      },
    });
    return { error: describeError(error, "transcribing your answer") };
  }

  // Save the answer the moment it is transcribed.
  //
  // Evaluation is slow and can exceed the function time limit, and when
  // it did, the whole request was killed and nothing was written: a
  // tester recorded seven answers and none of them survived. The
  // recording is the irreplaceable part. Scoring can be retried.
  const path = `${user.id}/${sessionQuestionId}-${attemptNumber}.webm`;
  const { error: uploadError } = await supabase.storage
    .from("answers")
    .upload(path, audio, {
      contentType: audio.type || "audio/webm",
      upsert: true,
    });

  if (uploadError) {
    await recordFailure({
      userId: user.id,
      stage: "upload",
      error: uploadError,
      context: { audioBytes: audio.size, audioType: audio.type || "unknown" },
    });
  }

  const { data: attempt, error: insertError } = await supabase
    .from("attempts")
    .insert({
      session_question_id: sessionQuestionId,
      user_id: user.id,
      attempt_number: attemptNumber,
      audio_path: uploadError ? null : path,
      transcript: transcript.text,
      scores: {
        // Which model judged this, so the two can be compared later
        // from the data rather than from memory.
        eval_model: currentEvalModel(),
        script_overlap: previousRewrite
          ? Math.round(scriptOverlap(transcript.text, previousRewrite) * 100)
          : null,
        delivery: { filler_words: countFillers(transcript.text) },
        words_per_minute:
          transcript.durationSeconds > 0
            ? Math.round(
                (transcript.text.split(/\s+/).length /
                  transcript.durationSeconds) *
                  60,
              )
            : null,
      },
    })
    .select("id")
    .single();

  if (insertError || !attempt) {
    await recordFailure({
      userId: user.id,
      stage: "attempt_insert",
      error: insertError,
      context: { sessionQuestionId, attemptNumber },
    });
    return { error: `Couldn't save your answer: ${insertError?.message}` };
  }

  // Answer keys are unreadable by clients on purpose, so the technical
  // rubric needs a server-side read to score against them.
  let answerKey = null;
  if (question.rubric === "technical") {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("question_answer_keys")
        .select("markers")
        .eq("question_id", question.id)
        .maybeSingle();
      answerKey = (data?.markers as { must_mention?: string[] }) ?? null;
    } catch (error) {
      // Scoring is less precise without the key, but still worth doing.
      console.error("Answer key lookup failed:", error);
    }
  }

  // Evaluation runs after the answer is already safe. If it fails or
  // times out, the recording and transcript survive and the person can
  // ask for feedback again rather than losing the answer.
  let result;
  try {
    result = await evaluateAnswer({
      question: question.body,
      // On a drill the context field holds the move being practised.
      move: question.source === "curated" ? question.context : null,
      rubric: question.rubric,
      transcript: transcript.text,
      durationSeconds: transcript.durationSeconds,
      answerKey,
      attemptNumber,
      previousTranscript,
      scriptOverlap: previousRewrite
        ? Math.round(scriptOverlap(transcript.text, previousRewrite) * 100)
        : null,
    });
  } catch (error) {
    await recordFailure({
      userId: user.id,
      stage: "evaluation",
      error,
      context: {
        rubric: question.rubric,
        attemptNumber,
        transcriptWords: transcript.text.split(/\s+/).length,
        hadAnswerKey: Boolean(answerKey),
      },
    });
    revalidatePath(`/practice/${link.session_id}`);
    return {
      ok: true,
      error:
        "Your answer is saved, but the feedback didn't finish. Open the question again to retry it.",
    };
  }

  const { error: updateError } = await supabase
    .from("attempts")
    .update({
      feedback: result.feedback,
      improved_answer: result.improved_answer,
      scores: {
        // Which model judged this, so the two can be compared later
        // from the data rather than from memory.
        eval_model: currentEvalModel(),
        script_overlap: previousRewrite
          ? Math.round(scriptOverlap(transcript.text, previousRewrite) * 100)
          : null,
        one_thing: result.one_thing,
        substance: result.substance,
        delivery: {
          ...result.delivery,
          // Counted from the transcript rather than taken from the
          // model, which approximates. A number the person can check
          // against their own transcript has to be right.
          filler_words: countFillers(transcript.text),
        },
        words_per_minute:
          transcript.durationSeconds > 0
            ? Math.round(
                (transcript.text.split(/\s+/).length /
                  transcript.durationSeconds) *
                  60,
              )
            : null,
      },
    })
    .eq("id", attempt.id);

  if (updateError) {
    await recordFailure({
      userId: user.id,
      stage: "attempt_update",
      error: updateError,
      context: { attemptId: attempt.id },
    });
  }

  revalidatePath(`/practice/${link.session_id}`);
  return { ok: true };
}

function describeError(error: unknown, during: string): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("DEEPGRAM_API_KEY is not set")) {
    return "Speech to text isn't configured yet. DEEPGRAM_API_KEY is missing.";
  }
  if (message.includes("ANTHROPIC_API_KEY is not set")) {
    return "The AI service isn't configured yet. ANTHROPIC_API_KEY is missing.";
  }
  if (message.includes("No speech was detected")) {
    return "We couldn't hear anything in that recording. Check your microphone and try again.";
  }
  if (message.includes("Transcription failed (401)")) {
    return "Speech to text rejected our credentials. The Deepgram key may be invalid.";
  }
  if (message.includes("cut off")) {
    return "The evaluation was cut off. Try a shorter answer.";
  }
  return `Something went wrong ${during}: ${message.slice(0, 200)}`;
}

export type RescoreState = { error?: string; ok?: boolean };

/**
 * Score an answer that was saved but never evaluated.
 *
 * Evaluation runs after the answer is written, so it can fail on its
 * own and leave a complete recording with no feedback. Until now the
 * only advice was to reload, which did nothing — nothing re-ran the
 * evaluation. This does.
 */
export async function rescoreAttempt(
  _prev: RescoreState,
  formData: FormData,
): Promise<RescoreState> {
  const attemptId = String(formData.get("attempt_id") ?? "");
  if (!attemptId) return { error: "Missing attempt." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // RLS means this only returns the caller's own attempt.
  const { data: attempt } = await supabase
    .from("attempts")
    .select(
      "id, transcript, attempt_number, feedback, session_question_id, session_questions (session_id, questions (id, body, rubric))",
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) return { error: "That answer isn't one of yours." };
  if (attempt.feedback) return { ok: true };
  if (!attempt.transcript) {
    return { error: "That answer has no transcript to work from." };
  }

  const nested = attempt.session_questions as unknown as {
    session_id: string;
    questions: { id: string; body: string; rubric: Rubric } | null;
  } | null;
  const question = nested?.questions;
  if (!question) return { error: "Couldn't load the question." };

  let answerKey = null;
  if (question.rubric === "technical") {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("question_answer_keys")
        .select("markers")
        .eq("question_id", question.id)
        .maybeSingle();
      answerKey = (data?.markers as { must_mention?: string[] }) ?? null;
    } catch (error) {
      console.error("Answer key lookup failed:", error);
    }
  }

  let result;
  try {
    result = await evaluateAnswer({
      question: question.body,
      rubric: question.rubric,
      transcript: attempt.transcript,
      durationSeconds: 75,
      answerKey,
      attemptNumber: attempt.attempt_number as number,
    });
  } catch (error) {
    await recordFailure({
      userId: user.id,
      stage: "evaluation_retry",
      error,
      context: { attemptId, rubric: question.rubric },
    });
    return {
      error:
 "That didn't work either. Your answer is still saved, try again in a moment.",
    };
  }

  const { error: updateError } = await supabase
    .from("attempts")
    .update({
      feedback: result.feedback,
      improved_answer: result.improved_answer,
      scores: {
        one_thing: result.one_thing,
        substance: result.substance,
        delivery: {
          ...result.delivery,
          filler_words: countFillers(attempt.transcript),
        },
      },
    })
    .eq("id", attemptId);

  if (updateError) {
    await recordFailure({
      userId: user.id,
      stage: "rescore_update",
      error: updateError,
      context: { attemptId },
    });
    return { error: "Couldn't save the feedback. Try again." };
  }

  revalidatePath(`/practice/${nested?.session_id}`);
  return { ok: true };
}
