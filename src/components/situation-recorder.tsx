"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerPlayback } from "@/components/answer-playback";

/**
 * Describe the situation out loud.
 *
 * Speaking it is the first half of the skill. A client who cannot
 * follow your explanation cannot agree with it either, and typing lets
 * someone edit until it is clear, which is the part that does not
 * transfer to a call.
 */
export function SituationRecorder({
  onRecorded,
  onCleared,
}: {
  onRecorded: (blob: Blob) => void;
  onCleared: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "recording" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const made = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (made.size < 1000) {
          setError("That came through empty. Check your microphone.");
          setPhase("idle");
          return;
        }
        setBlob(made);
        onRecorded(made);
        setPhase("done");
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setPhase("recording");
    } catch {
      setError(
        "Efata couldn't reach your microphone. Allow it, then try again.",
      );
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  if (phase === "done" && blob) {
    return (
      <div className="bg-card flex flex-col gap-4 rounded-[16px] p-5">
        <p className="ef-label text-sea">What you described</p>
        <AnswerPlayback blob={blob} />
        <button
          type="button"
          onClick={() => {
            setBlob(null);
            setSeconds(0);
            onCleared();
            setPhase("idle");
          }}
          className="text-ink-3 self-start text-[15px] underline underline-offset-4"
        >
          Say it again
        </button>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="bg-ink flex flex-col items-center gap-5 rounded-[16px] px-5 py-8">
        <div className="flex items-center gap-2.5">
          <span className="bg-sea-dusk animate-alive size-2 rounded-full" />
          <span className="text-sea-dusk text-[13px] font-semibold tracking-[0.16em] uppercase">
            Recording now
          </span>
        </div>
        <p className="text-paper font-serif text-[36px] tabular-nums">{mmss}</p>
        <button
          type="button"
          onClick={stop}
          className="border-paper/50 text-paper rounded-full border px-8 py-3.5 text-[16px] font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={start}
        className="bg-ink text-paper w-full rounded-full px-8 py-4 text-[17px] font-semibold"
      >
        Describe it out loud
      </button>

      <p className="ef-caption text-ink-3">
        Out loud on purpose. Explaining it clearly is half the skill.
      </p>

      {error && (
        <p role="alert" className="ef-body text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
