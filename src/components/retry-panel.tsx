"use client";

import { useState } from "react";
import { AnswerRecorder } from "@/components/answer-recorder";

type Props = {
  sessionQuestionId: string;
  attemptNumber: number;
  oneThing: string | null;
  improvedAnswer: string | null;
  scriptOverlap: number | null;
  hasAttempted: boolean;
  rated: boolean;
  onDone?: () => void;
};

/**
 * Two attempts, then move on.
 *
 * A third run on the same question is diminishing: by then the answer
 * is memorised rather than thought through, which is the opposite of
 * the skill. After the second attempt the better version is handed over
 * openly and the session moves forward.
 */
const MAX_ATTEMPTS = 2;
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
  const [recording, setRecording] = useState(false);

  if (!hasAttempted) {
    return (
      <AnswerRecorder
        sessionQuestionId={sessionQuestionId}
        attemptNumber={attemptNumber}
        oneThing={null}
      />
    );
  }

  const attemptsUsed = attemptNumber - 1;
  const canRetry = attemptsUsed < MAX_ATTEMPTS;
  const readIt = scriptOverlap != null && scriptOverlap >= READING_THRESHOLD;

  if (recording) {
    return (
      <div className="mt-8">
        <AnswerRecorder
          sessionQuestionId={sessionQuestionId}
          attemptNumber={attemptNumber}
          oneThing={oneThing}
        />
        <button
          onClick={() => setRecording(false)}
          className="text-faint hover:text-paper ef-caption mt-4 inline underline underline-offset-4 transition-colors"
        >
          Back to the feedback
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {readIt && (
        <div className="border-clay/40 bg-clay/10 mb-6 rounded-[12px] px-4 py-3">
          <p className="ef-body text-clay">
            That was {scriptOverlap}% the same wording as the version below.
            Reading it back is easy. Saying it your own way is the part that
            survives a real call.
          </p>
        </div>
      )}

      {/*
        The better version is the payoff for having spoken, so it leads
        rather than hiding behind a disclosure triangle. After the last
        attempt it is open by default: there is nothing left to protect.
      */}
      {improvedAnswer && (
        <details
          open={!canRetry}
          className="border-seaglass/30 bg-raised rounded-[16px] border p-5"
        >
          <summary className="ef-ui text-seaglass flex cursor-pointer items-center justify-between">
            <span>Hear it said better</span>
            <span className="ef-caption text-faint">Open</span>
          </summary>

          <p className="ef-caption text-faint mt-4">
            Same answer, same facts, yours — softeners out.
          </p>
          <p className="ef-body text-paper border-seaglass/40 mt-3 border-l-2 pl-4 italic">
            &ldquo;{improvedAnswer}&rdquo;
          </p>
          <p className="ef-caption text-faint mt-4">
            Read it aloud once. Then close this and say it your own way.
          </p>
        </details>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {canRetry ? (
          <>
            <button
              onClick={() => setRecording(true)}
              disabled={!rated}
              className="bg-paper text-dusk w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Try that one again
            </button>
            {!rated && (
              <p className="ef-caption text-faint text-center">
                Tell us whether the feedback was useful first
              </p>
            )}
          </>
        ) : (
          <p className="ef-caption text-faint text-center">
            Two attempts is enough on one question. Take the better version
            with you and keep going.
          </p>
        )}
      </div>
    </div>
  );
}
