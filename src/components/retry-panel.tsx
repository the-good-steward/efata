"use client";

import { useState } from "react";
import { AnswerRecorder } from "@/components/answer-recorder";

type Props = {
  sessionQuestionId: string;
  attemptNumber: number;
  oneThing: string | null;
  improvedAnswer: string | null;
  /** null on a first attempt, otherwise 0-100. */
  scriptOverlap: number | null;
  hasAttempted: boolean;
  /** Retrying is blocked until the last attempt has been rated. */
  rated: boolean;
};

const READING_THRESHOLD = 60;

export function RetryPanel({
  sessionQuestionId,
  attemptNumber,
  oneThing,
  improvedAnswer,
  scriptOverlap,
  hasAttempted,
  rated,
}: Props) {
  // "reviewing" shows the rewrite. "recording" deliberately hides it:
  // having the better wording on screen while speaking turns the retry
  // into a reading exercise, which is not the skill being practised.
  const [mode, setMode] = useState<"reviewing" | "recording">(
    hasAttempted ? "reviewing" : "recording",
  );

  const readIt = scriptOverlap != null && scriptOverlap >= READING_THRESHOLD;

  if (!hasAttempted) {
    return (
      <AnswerRecorder
        sessionQuestionId={sessionQuestionId}
        attemptNumber={attemptNumber}
        oneThing={null}
      />
    );
  }

  if (mode === "reviewing") {
    return (
      <div className="mt-8">
        {readIt && (
          <div className="mb-6 rounded-sm border border-flag/40 bg-flag/10 px-4 py-3">
            <p className="font-body text-sm leading-relaxed text-flag">
              That last answer was {scriptOverlap}% the same wording as the
              suggested rewrite. Reading it back is easy; saying it your own
              way is the part that survives a real call. Try it again without
              looking.
            </p>
          </div>
        )}

        {improvedAnswer && (
          <details className="mb-6">
            <summary className="text-spoken font-body cursor-pointer text-sm underline underline-offset-4">
              Hear it said better
            </summary>
            <p className="text-parchment/90 font-body border-rule mt-3 border-l pl-4 text-sm leading-relaxed italic">
              {improvedAnswer}
            </p>
            <p className="text-ash font-body mt-3 text-xs">
              Read it once, out loud. Then close it and say it in your own
              words.
            </p>
          </details>
        )}

        <button
          onClick={() => setMode("recording")}
          disabled={!rated}
          className="bg-parchment text-ink font-body hover:bg-parchment/85 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          Try again
        </button>
        <p className="text-ash font-body mt-3 text-xs">
          {rated
            ? "The rewrite gets hidden while you record, on purpose."
            : "Tell us whether that feedback was useful first — it takes one tap, and it's how the feedback gets better."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <AnswerRecorder
        sessionQuestionId={sessionQuestionId}
        attemptNumber={attemptNumber}
        oneThing={oneThing}
      />
      <button
        onClick={() => setMode("reviewing")}
        className="text-ash font-body hover:text-parchment mt-4 text-xs underline underline-offset-4 transition-colors"
      >
        Show the feedback again
      </button>
    </div>
  );
}
