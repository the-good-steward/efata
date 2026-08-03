"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAnswer, type AnswerState } from "@/app/practice/[sessionId]/actions";

type Props = {
  sessionQuestionId: string;
  attemptNumber: number;
  /** Called once the answer is saved, so the parent can leave the
   *  recording state. Without it the recorder stays mounted and its
   *  phase never leaves "submitting". */
  onSubmitted?: () => void;
  /** Shown above the recorder on a retry, so the fix is in view while
   *  they speak. This is the point of the retry loop. */
  oneThing?: string | null;
};

type Phase = "idle" | "prep" | "recording" | "review" | "submitting";

const MAX_SECONDS = 150;
/**
 * Beat between seeing the question and recording starting.
 *
 * Short on purpose. The skill being trained is thinking on your feet,
 * and a long pause turns practice into rehearsal — which is exactly
 * what does not transfer to a live call. Five seconds is enough to take
 * a breath and pick an angle, not enough to draft an answer.
 */
const PREP_SECONDS = 5;

/**
 * Nothing should sit on a loading state indefinitely. If the server has
 * not answered in seventy seconds it is not going to: the function
 * limit is sixty, so past that the request is already dead.
 */
function SubmitWatchdog({ onTimeout }: { onTimeout: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, 70000);
    return () => clearTimeout(timer);
  }, [onTimeout]);
  return null;
}

export function AnswerRecorder({
  sessionQuestionId,
  attemptNumber,
  oneThing,
  onSubmitted,
}: Props) {
  const router = useRouter();
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
      if (prepRef.current) clearInterval(prepRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const prepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Microphone access has to be requested from a user gesture, so the
   * permission prompt happens here rather than after the countdown.
   */
  async function ready() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPhase("prep");
      setPrepLeft(PREP_SECONDS);

      prepRef.current = setInterval(() => {
        setPrepLeft((left) => {
          if (left <= 1) {
            if (prepRef.current) clearInterval(prepRef.current);
            beginRecording();
            return 0;
          }
          return left - 1;
        });
      }, 1000);
    } catch {
      setError(
        "We couldn't access your microphone. Check your browser permissions and try again.",
      );
    }
  }

  function beginRecording() {
    const stream = streamRef.current;
    if (!stream) return;

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
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function discard() {
    if (prepRef.current) clearInterval(prepRef.current);
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

    try {
      const state: AnswerState = await Promise.race([
        submitAnswer({}, formData),
        // Belt and braces: if the request neither resolves nor rejects,
        // surface something rather than spinning. Generous, because
        // transcription plus evaluation genuinely takes a while.
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 120000),
        ),
      ]);

      if (state.error) {
        setError(state.error);
        setPhase("review");
        return;
      }
      // Success has to be handled explicitly. Relying on the page
      // revalidating left this component mounted with its phase still
      // "submitting", so the screen sat on "listening back" forever
      // even though the answer had saved. A tester lost a whole
      // session to this.
      router.refresh();
      onSubmitted?.();
      setPhase("idle");
      setBlob(null);
      setSeconds(0);
    } catch {
      // A thrown action means the request died — usually the function
      // hitting its time limit. Previously this left the screen sitting
      // on "listening back" forever and the answer was gone. Now the
      // recording is still in hand and can be sent again.
      setError(
        "That took too long and didn't go through. Your recording is still here — try sending it again.",
      );
      setPhase("review");
    }
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mt-6">
      {attemptNumber > 1 && oneThing && (
        <div className="border-lamp/40 bg-lamp/5 mb-6 rounded-sm border px-4 py-3">
          <p className="text-lamp font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
            This time
          </p>
          <p className="text-parchment font-body mt-2 text-sm leading-relaxed">
            {oneThing}
          </p>
        </div>
      )}

      {phase === "idle" && (
        <div>
          <button
            onClick={ready}
            className="bg-paper text-dusk w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90"
          >
            {attemptNumber > 1 ? "I'm ready" : "I'm ready"}
          </button>
          <p className="ef-caption text-faint mt-3 text-center">
            Aim for 60 to 90 seconds
          </p>
        </div>
      )}

      {phase === "prep" && (
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="absolute -rotate-90" width="64" height="64" aria-hidden="true">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--rule)"
                strokeWidth="2"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--lamp)"
                strokeWidth="2"
                strokeDasharray="176"
                strokeDashoffset={176 * (1 - prepLeft / PREP_SECONDS)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="text-parchment font-display text-2xl tabular-nums">
              {prepLeft}
            </span>
          </div>
          <div>
            <p className="ef-body text-paper">Take a breath.</p>
            <p className="ef-caption text-faint">
              Recording starts on its own
            </p>
          </div>
        </div>
      )}

      {phase === "recording" && (
        <div className="flex items-center gap-4">
          <button
            onClick={stopRecording}
            className="font-body rounded-sm border border-spoken/60 px-4 py-2.5 text-sm font-medium text-spoken transition-colors hover:bg-spoken/10"
          >
            Done
          </button>
          <span className="text-ash font-body flex items-center gap-2 text-sm tabular-nums">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-spoken" />
            {mmss}
          </span>
          <span className="ef-caption text-faint">
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
              className="bg-parchment text-ink font-body hover:bg-parchment/85 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Send this one
            </button>
            <button
              onClick={discard}
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Record it again
            </button>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div>
          <SubmitWatchdog
            onTimeout={() => {
              setError(
                "This is taking longer than it should. Your recording is safe — give it a moment, or send it again.",
              );
              setPhase("review");
            }}
          />
          <p className="ef-label text-seaglass">Listening back</p>
          <p className="ef-body text-paper mt-3">
            Going through what you said.
          </p>
          <p className="ef-caption text-faint mt-1">
            About twenty seconds. You can put the phone down.
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="font-body mt-4 rounded-sm border border-flag/40 bg-flag/10 px-3 py-2 text-sm text-flag"
        >
          {error}
        </p>
      )}
    </div>
  );
}
