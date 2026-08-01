"use client";

import { useEffect, useRef, useState } from "react";
import { submitAnswer, type AnswerState } from "@/app/practice/[sessionId]/actions";

type Props = {
  sessionQuestionId: string;
  attemptNumber: number;
  /** Shown above the recorder on a retry, so the fix is in view while
   *  they speak. This is the point of the retry loop. */
  oneThing?: string | null;
};

type Phase = "idle" | "recording" | "review" | "submitting";

const MAX_SECONDS = 150;

export function AnswerRecorder({
  sessionQuestionId,
  attemptNumber,
  oneThing,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Release the microphone if the component unmounts mid-recording,
  // otherwise the browser keeps showing the recording indicator.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: recorder.mimeType }));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setPhase("review");
      };

      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setPhase("recording");

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError(
        "We couldn't access your microphone. Check your browser permissions and try again.",
      );
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function discard() {
    setBlob(null);
    setSeconds(0);
    setPhase("idle");
    setError(null);
  }

  async function submit() {
    if (!blob) return;
    setPhase("submitting");
    setError(null);

    const formData = new FormData();
    formData.append("session_question_id", sessionQuestionId);
    formData.append("audio", blob, "answer.webm");

    const state: AnswerState = await submitAnswer({}, formData);

    if (state.error) {
      setError(state.error);
      setPhase("review");
      return;
    }
    // Success revalidates the page, which re-renders with the feedback.
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mt-6">
      {attemptNumber > 1 && oneThing && (
        <div className="border-gold/40 bg-gold/5 mb-6 rounded-sm border px-4 py-3">
          <p className="text-gold font-body text-xs tracking-[0.2em] uppercase">
            This time
          </p>
          <p className="text-parchment font-body mt-2 text-sm leading-relaxed">
            {oneThing}
          </p>
        </div>
      )}

      {phase === "idle" && (
        <button
          onClick={startRecording}
          className="bg-parchment text-ink font-body hover:bg-gold rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {attemptNumber > 1 ? "Record attempt " + attemptNumber : "Record your answer"}
        </button>
      )}

      {phase === "recording" && (
        <div className="flex items-center gap-4">
          <button
            onClick={stopRecording}
            className="font-body rounded-sm bg-red-900/70 px-4 py-2.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-900"
          >
            Stop
          </button>
          <span className="text-ash font-body flex items-center gap-2 text-sm tabular-nums">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {mmss}
          </span>
          <span className="text-ash/60 font-body text-xs">
            Aim for 60 to 90 seconds
          </span>
        </div>
      )}

      {phase === "review" && blob && (
        <div className="flex flex-col gap-4">
          <audio
            controls
            src={URL.createObjectURL(blob)}
            className="w-full max-w-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={submit}
              className="bg-parchment text-ink font-body hover:bg-gold rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Get feedback
            </button>
            <button
              onClick={discard}
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Record again
            </button>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <p className="text-ash font-body text-sm">
          Listening to your answer and writing feedback. About 20 seconds.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="font-body mt-4 rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
