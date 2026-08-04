"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerRecorder } from "@/components/answer-recorder";
import { Working } from "@/components/working";
import { RescoreButton } from "@/components/rescore-button";

type Props = {
  sessionQuestionId: string;
  attemptNumber: number;
  oneThing: string | null;
  improvedAnswer: string | null;
  scriptOverlap: number | null;
  hasAttempted: boolean;
  /**
   * Whether the feedback for the latest attempt has actually arrived.
   *
   * The answer is saved before it is scored, so there is a window where
   * the attempt exists with nothing in it. Offering "try it again"
   * during that window lets someone start their second run having read
   * nothing, which is the one thing the second run is for.
   */
  feedbackReady: boolean;
  /**
   * Feedback that never arrived. Evaluation can fail while the answer
   * itself saved fine, and leaving someone on a spinner forever is
   * worse than telling them and letting them carry on.
   */
  feedbackStalled: boolean;
  /** The attempt awaiting feedback, so it can be scored again. */
  attemptId: string | null;
  onSubmittingChange?: (submitting: boolean) => void;
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
  feedbackReady,
  feedbackStalled,
  attemptId,
  onSubmittingChange,
}: Props) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<HTMLDivElement>(null);

  // Tapping 'try that one again' swaps the feedback for the recorder
  // further down the page, which left people scrolling to find the
  // thing they had just asked for.
  useEffect(() => {
    if (recording) {
      recorderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [recording]);

  if (!hasAttempted) {
    return (
      <AnswerRecorder
        sessionQuestionId={sessionQuestionId}
        attemptNumber={attemptNumber}
        oneThing={null}
        onSubmittingChange={onSubmittingChange}
      />
    );
  }

  const attemptsUsed = attemptNumber - 1;
  const canRetry = attemptsUsed < MAX_ATTEMPTS;
  const readIt = scriptOverlap != null && scriptOverlap >= READING_THRESHOLD;

  if (recording) {
    return (
      <div ref={recorderRef} className="mt-8 scroll-mt-6">
        <AnswerRecorder
          sessionQuestionId={sessionQuestionId}
          attemptNumber={attemptNumber}
          oneThing={oneThing}
          onSubmittingChange={onSubmittingChange}
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
        The better version is withheld until the retry is spent.
        Offering it after the first attempt would turn the second into
        recitation — they would read our wording rather than rebuild the
        answer, which is the skill that transfers to a live call.
      */}
      {!canRetry && improvedAnswer && (
        <div className="border-seaglass/30 bg-raised rounded-[16px] border p-5">
          <p className="ef-ui text-seaglass">Here it is said better</p>
          <p className="ef-caption text-faint mt-3">
            Same answer, same facts, yours — softeners out.
          </p>
          <p className="ef-body text-paper border-seaglass/40 mt-3 border-l-2 pl-4 italic">
            &ldquo;{improvedAnswer}&rdquo;
          </p>
          <p className="ef-caption text-faint mt-4">
            Say it aloud once before you move on. Hearing your own words come
            out cleanly is what makes them stick.
          </p>
        </div>
      )}

      {!feedbackReady && !feedbackStalled && (
        <div className="mt-6">
          <Working
            lines={["Reading your answer back", "Writing your feedback"]}
            note="A few seconds. Nothing to do yet."
          />
        </div>
      )}

      {feedbackStalled && (
        <div className="border-clay/40 bg-clay/10 mt-6 rounded-[16px] p-5">
          <p className="ef-ui text-clay">The feedback didn&rsquo;t finish</p>
          <p className="ef-caption text-muted mt-2">
            Your answer and transcript are saved. This happens when the
            scoring takes too long, and it can be run again.
          </p>
          {attemptId && <RescoreButton attemptId={attemptId} />}
        </div>
      )}

      <div
        className={`mt-6 flex flex-col gap-3 ${
          feedbackReady || feedbackStalled ? "" : "pointer-events-none hidden"
        }`}
      >
        {canRetry ? (
          <>
            <button
              onClick={() => setRecording(true)}
              className="bg-paper text-dusk w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90"
            >
              Try it again
            </button>
            <div className="border-seaglass/25 bg-seaglass/5 rounded-[12px] px-4 py-3">
              <p className="ef-ui text-seaglass">After this run</p>
              <p className="ef-caption text-muted mt-1.5">
                The exact words to say, in your voice, ready to use on a real
                call.
              </p>
            </div>
          </>
        ) : (
          <p className="ef-caption text-faint text-center">
            Two attempts is enough on one question. Take that version with you
            and keep going.
          </p>
        )}
      </div>
    </div>
  );
}
