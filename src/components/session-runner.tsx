"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Question from "@/components/session/Question";
import HeldBreath from "@/components/session/HeldBreath";
import RecordingScreen from "@/components/session/Recording";
import ListenBack from "@/components/session/ListenBack";
import WhatYouSaid, { type Token } from "@/components/session/WhatYouSaid";
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
  | "transcript";

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

export function SessionRunner({ questions }: { questions: RunnerQuestion[] }) {
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

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const question = questions[index];
  const attempts = question?.attempts ?? [];
  const latest = attempts[attempts.length - 1];
  const attemptNumber = (attempts.length + 1) as 1 | 2;

  // The breath is exactly five seconds, then recording begins on its
  // own. Nothing announces it, which is the point.
  useEffect(() => {
    if (phase !== "breath") return;
    const timer = setTimeout(() => setPhase("recording"), BREATH_MS);
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
          setBlob(
            new Blob(chunksRef.current, {
              type: recorder.mimeType || "audio/webm",
            }),
          );
        };
        recorder.start();
        recorderRef.current = recorder;
      } catch {
        setError(
          "Efata couldn't reach your microphone. Allow it in your browser settings, then try again.",
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
    const timer = setInterval(() => {
      setSeconds((s) => {
        // A hundred seconds is the ceiling. Past that it is a monologue
        // rather than an answer, and the transcription costs more.
        if (s + 1 >= MAX_SECONDS) stopRecording();
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setPhase("listen");
  }

  // Sending happens as soon as the recording lands, so the twenty
  // second wait overlaps with them listening back rather than following
  // it.
  useEffect(() => {
    if (phase !== "listen" || !blob) return;

    let done = false;
    const grow = setInterval(() => {
      setAnalysisPct((p) => (done ? 100 : Math.min(p + 4, 95)));
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
        done = true;
        setAnalysisPct(100);
        router.refresh();
      }
    })();

    return () => clearInterval(grow);
  }, [phase, blob, question.linkId, attemptNumber, router]);

  if (!question) return null;

  const ready = Boolean(latest?.feedback) && analysisPct >= 100;

  if (phase === "breath") {
    return (
      <HeldBreath
        question={question.body}
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
          audioRef.current = null;
          setAnalysisPct(0);
          setPhase("breath");
        }}
        onContinue={() => setPhase("transcript")}
        onLeave={() => router.push("/practice")}
      />
    );
  }

  if (phase === "transcript" && latest?.transcript) {
    const hedges = latest.scores?.delivery?.hedging ?? [];
    return (
      <WhatYouSaid
        index={index + 1}
        total={questions.length}
        tokens={tokenise(latest.transcript, hedges)}
        hedgeCount={hedges.length}
        attempt={attemptNumber === 1 ? 2 : 1}
        onContinue={() => {
          // Feedback screens land next; for now the loop returns to the
          // question so a session can still be completed.
          if (attempts.length >= 2 && index + 1 < questions.length) {
            setIndex(index + 1);
          }
          setBlob(null);
          audioRef.current = null;
          setAnalysisPct(0);
          setPhase("question");
        }}
        onLeave={() => router.push("/practice")}
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
        question={question.body}
        why={question.context ?? "Answer it the way you would on a call."}
        onReady={() => {
          setError(null);
          setSeconds(0);
          setPhase("breath");
        }}
        onLeave={() => router.push(`/practice`)}
      />
    </>
  );
}
