"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Question from "@/components/session/Question";
import HeldBreath from "@/components/session/HeldBreath";
import RecordingScreen from "@/components/session/Recording";
import ListenBack from "@/components/session/ListenBack";
import WhatYouSaid, { type Token } from "@/components/session/WhatYouSaid";
import WhatItCostYou from "@/components/session/WhatItCostYou";
import TheCounts from "@/components/session/TheCounts";
import WhatMoved from "@/components/session/WhatMoved";
import YoursSaidStraight from "@/components/session/YoursSaidStraight";
import SessionVerdict from "@/components/session/SessionVerdict";
import { buildVerdict, type SessionAnswer } from "@/lib/session-verdict";
import { submitAnswer, type AnswerState } from "@/app/practice/[sessionId]/actions";
import type { RunnerQuestion } from "@/components/practice-runner";

/**
 * The session as one screen at a time.
 *
 * Replaces the scrolling page: each step owns the whole viewport, so
 * nobody hunts for the thing they just asked for. The design's screens
 * are static and take props; all the state lives here.
 */
type Phase =
  | "question"
  | "breath"
  | "recording"
  | "listen"
  | "transcript"
  | "read"
  | "counts"
  | "moved"
  | "rewrite"
  | "verdict";

const BREATH_MS = 5000;
const MAX_SECONDS = 100;

/** Splits a transcript into plain text and the hedges to mark. */
function tokenise(transcript: string, hedges: string[]): Token[] {
  const phrases = [...new Set(hedges.map((h) => h.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (phrases.length === 0) return [{ text: transcript }];

  const pattern = new RegExp(
    `(${phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );

  return transcript.split(pattern).map((piece) => ({
    text: piece,
    hedge: phrases.some((p) => p.toLowerCase() === piece.trim().toLowerCase()),
  }));
}

export function SessionRunner({
  questions,
  fromYourSituation = false,
  yourWords,
}: {
  questions: RunnerQuestion[];
  fromYourSituation?: boolean;
  yourWords?: string | null;
}) {
  const router = useRouter();

  const firstUnanswered = questions.findIndex((q) => q.attempts.length < 2);
  const [index, setIndex] = useState(
    firstUnanswered === -1 ? 0 : firstUnanswered,
  );
  const [phase, setPhase] = useState<Phase>("question");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [playing, setPlaying] = useState(false);
  const [analysisPct, setAnalysisPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [breathDone, setBreathDone] = useState(false);

  // One submission per recording. Without this the effect re-fired
  // when the attempt count changed after saving, which re-sent the
  // answer and pulled the progress back below complete, so the button
  // to continue appeared and then vanished.
  const submittedRef = useRef<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const question = questions[index];
  const attempts = question?.attempts ?? [];
  const latest = attempts[attempts.length - 1];
  const attemptNumber = (attempts.length + 1) as 1 | 2;

  // The breath is five seconds of nothing being asked of them. When it
  // finishes the action appears, and they open the microphone
  // themselves rather than being caught mid-thought.
  useEffect(() => {
    if (phase !== "breath") return;
    const timer = setTimeout(() => setBreathDone(true), BREATH_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") return;

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const recorded = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          // An empty recording means the microphone produced nothing.
          // Sending it would cost a transcription and come back blank,
          // so say so here rather than letting the next screen wait on
          // something that will never arrive.
          if (recorded.size < 1000) {
            setError(
              "That recording came through empty. Check your microphone is not muted, then try again.",
            );
            setPhase("question");
            return;
          }

          setBlob(recorded);
        };
        recorder.start();
        recorderRef.current = recorder;
      } catch (mediaError) {
        console.error("Microphone unavailable:", mediaError);
        setError(
          "Efata lost access to your microphone. Check nothing else is using it, allow access when asked, then tap I'm ready again.",
        );
        setPhase("question");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  /**
   * The ceiling, watched from outside the timer.
   *
   * This used to call stop from inside the state updater, which runs
   * during render, so React could run it more than once and tear the
   * recording down mid-answer. That is what dropped people back to the
   * question while they were still speaking.
   */
  useEffect(() => {
    if (phase !== "recording") return;
    if (seconds < MAX_SECONDS) return;
    stopRecording();
  }, [phase, seconds]);

  function stopRecording() {
    const recorder = recorderRef.current;

    // Nothing to stop means the recorder was already torn down. Going
    // to the listen screen with no recording would hang there forever,
    // so send them back to the question with the reason instead.
    if (!recorder) {
      setError(
        "The recording stopped before it could be saved. Tap I'm ready and give it another go.",
      );
      setPhase("question");
      return;
    }

    recorderRef.current = null;
    recorder.stop();
    setPhase("listen");
  }

  // Sending happens as soon as the recording lands, so the twenty
  // second wait overlaps with them listening back rather than following
  // it.
  useEffect(() => {
    if (phase !== "listen" || !blob) return;
    if (submittedRef.current === blob) return;


    submittedRef.current = blob;

    let finished = false;
    const grow = setInterval(() => {
      if (finished) return;
      setAnalysisPct((p) => Math.min(p + 4, 95));
    }, 700);

    (async () => {
      const formData = new FormData();
      formData.append("session_question_id", question.linkId);
      formData.append("attempt_number", String(attemptNumber));
      formData.append("audio", blob, "answer.webm");

      try {
        const state: AnswerState = await submitAnswer({}, formData);
        if (state.error && !state.ok) setError(state.error);
      } catch {
        setError("That took too long. Your answer may still have saved.");
      } finally {
        finished = true;
        setAnalysisPct(100);
        router.refresh();
      }
    })();

    return () => clearInterval(grow);
    // Deliberately keyed on the recording alone. Anything else here
    // would re-run this when the saved attempt arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, blob]);

  /**
   * The wait needs to look alive.
   *
   * A single line that never changes reads as stuck, and twenty seconds
   * is long enough for someone to wonder. These describe the work, and
   * the last one thanks them for waiting rather than pretending it is
   * nearly done.
   */
  const WAITING = [
    "Going through what you said. Twenty seconds or so.",
    "Counting the fillers and working out your pace.",
    "Looking for the places you softened it.",
    "Writing your feedback now.",
    "Still going. Thank you for your patience.",
    "Nearly there. It is worth the wait.",
  ];
  const [waitStep, setWaitStep] = useState(0);

  useEffect(() => {
    if (phase !== "listen") return;
    const timer = setInterval(() => {
      setWaitStep((w) => Math.min(w + 1, WAITING.length - 1));
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!question) return null;

  const ready = Boolean(latest?.feedback) && analysisPct >= 100;

  if (phase === "breath") {
    return (
      <HeldBreath
        question={question.body}
        ready={breathDone}
        onStart={() => setPhase("recording")}
        caption={
          attemptNumber === 2 && latest?.scores?.one_thing
            ? latest.scores.one_thing
            : "Take a breath."
        }
      />
    );
  }

  if (phase === "recording") {
    return (
      <RecordingScreen
        question={question.body}
        elapsedSeconds={seconds}
        coachingLine={
          attemptNumber === 2 ? (latest?.scores?.one_thing ?? undefined) : undefined
        }
        onDone={stopRecording}
      />
    );
  }

  if (phase === "listen") {
    return (
      <ListenBack
        index={index + 1}
        total={questions.length}
        attempt={attemptNumber}
        takeLength={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
        playing={playing}
        playedPct={0}
        analysisPct={analysisPct}
        ready={ready}
        waitingLine={WAITING[waitStep]}
        onTogglePlay={() => {
          if (!blob) return;
          if (!audioRef.current) {
            audioRef.current = new Audio(URL.createObjectURL(blob));
            audioRef.current.onended = () => setPlaying(false);
          }
          if (playing) audioRef.current.pause();
          else void audioRef.current.play();
          setPlaying(!playing);
        }}
        onRerecord={() => {
          setSeconds(0);
          setBlob(null);
          submittedRef.current = null;
          audioRef.current = null;
          setAnalysisPct(0);
          setBreathDone(false);
          setPhase("breath");
        }}
        onContinue={() => setPhase("transcript")}
        onLeave={() => router.push("/practice")}
      />
    );
  }

  const delivery = latest?.scores?.delivery;
  const fillerCount = delivery?.filler_words ?? 0;
  const wpm = latest?.scores?.words_per_minute ?? 0;
  const takeLength = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  if (phase === "transcript" && latest?.transcript) {
    const hedges = delivery?.hedging ?? [];
    return (
      <WhatYouSaid
        index={index + 1}
        total={questions.length}
        tokens={tokenise(latest.transcript, hedges)}
        hedgeCount={hedges.length}
        attempt={attempts.length >= 2 ? 2 : 1}
        onContinue={() => setPhase(attempts.length >= 2 ? "moved" : "read")}
        onLeave={() => router.push("/practice")}
      />
    );
  }

  if (phase === "read" && latest) {
    return (
      <WhatItCostYou
        index={index + 1}
        total={questions.length}
        read={latest.feedback ?? ""}
        talkingPoints={latest.scores?.talking_points ?? []}
        fillerCount={fillerCount}
        wpm={wpm}
        nextLabel="Say it again"
        onCounts={() => setPhase("counts")}
        onBack={() => setPhase("transcript")}
        onContinue={() => {
          setSeconds(0);
          setBlob(null);
          submittedRef.current = null;
          audioRef.current = null;
          setAnalysisPct(0);
          setBreathDone(false);
          setPhase("breath");
        }}
        onLeave={() => router.push("/practice")}
      />
    );
  }

  if (phase === "counts") {
    return (
      <TheCounts
        index={index + 1}
        total={questions.length}
        fillerCount={fillerCount}
        takeLength={takeLength}
        wpm={wpm}
        wpmNote={
          wpm > 190
            ? "words per minute · quick"
            : wpm < 110
              ? "words per minute · slow"
              : "words per minute · steady"
        }
        phrases={delivery?.hedging ?? []}
        onBack={() => setPhase("read")}
        onLeave={() => router.push("/practice")}
      />
    );
  }

  if (phase === "moved" && latest) {
    const first = attempts[0];
    return (
      <WhatMoved
        index={index + 1}
        total={questions.length}
        summary={latest.feedback ?? ""}
        fillerCount={fillerCount}
        previousFillerCount={first?.scores?.delivery?.filler_words ?? 0}
        wpm={wpm}
        previousWpm={first?.scores?.words_per_minute ?? 0}
        onContinue={() => setPhase("rewrite")}
        onLeave={() => router.push("/practice")}
      />
    );
  }

  // The rewrite is reachable only from "moved", which itself is only
  // reachable once two attempts exist. If it could be read earlier the
  // second attempt would become recitation.
  if (phase === "rewrite" && latest?.improved_answer) {
    const isLast = index + 1 >= questions.length;
    return (
      <YoursSaidStraight
        index={index + 1}
        total={questions.length}
        rewrite={latest.improved_answer}
        playing={false}
        isLastQuestion={isLast}
        onNext={() => {
          if (isLast) {
            setPhase("verdict");
            return;
          }
          setIndex(index + 1);
          setSeconds(0);
          setBlob(null);
          submittedRef.current = null;
          audioRef.current = null;
          setAnalysisPct(0);
          setBreathDone(false);
          setPhase("question");
        }}
      />
    );
  }

  if (phase === "verdict") {
    const answers: SessionAnswer[] = questions
      .filter((q) => q.attempts.length > 0)
      .map((q) => {
        const a = q.attempts[q.attempts.length - 1];
        const f = q.attempts[0];
        return {
          attemptCount: q.attempts.length,
          fillerWords: a.scores?.delivery?.filler_words ?? 0,
          wordCount: (a.transcript ?? "").trim().split(/\s+/).length,
          wordsPerMinute: a.scores?.words_per_minute ?? null,
          substanceFirst: f.scores?.substance?.score ?? null,
          substanceLast: a.scores?.substance?.score ?? null,
          hedging: a.scores?.delivery?.hedging ?? [],
        };
      });

    const verdict = buildVerdict(answers, questions.length);
    const before = questions.reduce(
      (n, q) => n + (q.attempts[0]?.scores?.delivery?.hedging?.length ?? 0),
      0,
    );
    const after = questions.reduce(
      (n, q) =>
        n +
        (q.attempts.length > 1
          ? (q.attempts[q.attempts.length - 1]?.scores?.delivery?.hedging
              ?.length ?? 0)
          : 0),
      0,
    );

    return (
      <SessionVerdict
        questionCount={questions.length}
        headline={verdict.headline}
        body={verdict.body}
        softenersBefore={before}
        softenersAfter={after}
        onLogInterview={() => router.push("/recall")}
        onBackToPractice={() => router.push("/practice")}
      />
    );
  }

  return (
    <>
      {error && (
        <p role="alert" className="bg-clay/10 text-clay px-6 py-3 text-[15px]">
          {error}
        </p>
      )}
      <Question
        index={index + 1}
        total={questions.length}
        category={question.type === "technical" ? "Technical" : "Situational"}
        fromYourSituation={fromYourSituation}
        yourWords={yourWords}
        question={question.body}
        why={question.context ?? "Answer it the way you would on a call."}
        onReady={() => {
          setError(null);
          setSeconds(0);
          setBreathDone(false);
          setPhase("breath");
        }}
        onLeave={() => router.push(`/practice`)}
      />
    </>
  );
}
