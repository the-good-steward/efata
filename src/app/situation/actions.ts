"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSituationQuestion } from "@/lib/questions/situation";
import { recordFailure } from "@/lib/failures";
import { checkSessionLimit, type Tier } from "@/lib/limits";
import { transcribeAudio } from "@/lib/transcribe";

export type SituationState = { error?: string; sessionId?: string };

const MIN = 25;
const MAX = 1500;

/**
 * Practise one conversation that is actually coming up.
 *
 * Reuses the session machinery with a single question, so recording,
 * coaching, the retry and the rewrite all work unchanged. Cheaper than
 * a full session: one small call to shape the question, no research.
 */
export async function startSituation(
  _prev: SituationState,
  formData: FormData,
): Promise<SituationState> {
  /**
   * Spoken by default.
   *
   * Describing the problem out loud is the first half of the skill: a
   * client who cannot follow your explanation cannot agree with it
   * either. Typing lets someone edit until it is clear, which is
   * exactly the part that does not transfer to a call.
   *
   * Typed text is still accepted, for a noisy room or anyone who
   * cannot speak right now.
   */
  const audio = formData.get("audio");
  let situation = String(formData.get("situation") ?? "").trim();

  if (audio instanceof File && audio.size > 1000) {
    const supabaseForUser = await createClient();
    const {
      data: { user: speaker },
    } = await supabaseForUser.auth.getUser();

    try {
      const transcript = await transcribeAudio(
        await audio.arrayBuffer(),
        audio.type || "audio/webm",
      );
      situation = transcript.text.trim();
    } catch (error) {
      await recordFailure({
        userId: speaker?.id ?? null,
        stage: "situation_transcribe",
        error,
        context: { bytes: audio.size },
      });
      return {
        error:
          "Efata couldn't make out that recording. Try again somewhere quieter, or type it instead.",
      };
    }
  }

  if (situation.length < MIN) {
    return {
      error:
        "Tell us a bit more. What do they want, and what makes it awkward to say?",
    };
  }
  if (situation.length > MAX) {
    return { error: "That's long. A few sentences is plenty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, primary_role_id")
    .eq("id", user.id)
    .maybeSingle();

  const limit = await checkSessionLimit(
    supabase,
    user.id,
    (profile?.tier ?? "free") as Tier,
  );
  if (!limit.allowed) return { error: limit.message };

  let built;
  try {
    built = await buildSituationQuestion(situation);
  } catch (error) {
    await recordFailure({
      userId: user.id,
      stage: "situation_build",
      error,
      context: { chars: situation.length },
    });
    return { error: "Couldn't set that up. Try again in a moment." };
  }

  const admin = createAdminClient();

  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .insert({
      user_id: user.id,
      role_id: profile?.primary_role_id ?? null,
      title: built.title,
      job_post: situation,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    await recordFailure({
      userId: user.id,
      stage: "situation_session",
      error: sessionError,
      context: {},
    });
    return { error: "Couldn't start that. Try again." };
  }

  const { data: question, error: questionError } = await admin
    .from("questions")
    .insert({
      role_id: profile?.primary_role_id ?? null,
      type: "hypothetical",
      rubric: "situational",
      body: built.prompt,
      context: built.why,
      difficulty: 3,
      tier: "free",
      source: "generated",
      status: "approved",
      submitted_by: user.id,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    await recordFailure({
      userId: user.id,
      stage: "situation_question",
      error: questionError,
      context: {},
    });
    return { error: "Couldn't set that up. Try again." };
  }

  await admin
    .from("session_questions")
    .insert({ session_id: session.id, question_id: question.id, position: 1 });

  return { sessionId: session.id };
}
