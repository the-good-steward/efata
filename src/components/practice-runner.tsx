"use client";

import { useState } from "react";
import Link from "next/link";
import { RetryPanel } from "@/components/retry-panel";
import { FeedbackRating } from "@/components/feedback-rating";

export type RunnerQuestion = {
  linkId: string;
  body: string;
  context: string | null;
  type: string;
  attempts: {
    id: string;
    attempt_number: number;
    feedback: string | null;
    improved_answer: string | null;
    rated: boolean;
    scores: {
      script_overlap?: number | null;
      one_thing?: string | null;
      substance?: { score?: number };
      delivery?: {
        score?: number;
        filler_words?: number;
        hedging?: string[];
        pace_note?: string;
      };
      words_per_minute?: number | null;
    } | null;
  }[];
};

/**
 * Change since the previous attempt, in words rather than a number.
 *
 * Scores are still recorded — calibration depends on them — but they
 * are not shown. A 3/5 tells someone they have been graded; "clearer
 * than last time" tells them the thing that actually matters, which is
 * whether the second run was better than the first. Nothing here is a
 * pass or a fail.
 */
function movement(
  current?: number,
  previous?: number,
): { label: string; tone: "up" | "flat" | "down" } | null {
  if (!current || !previous) return null;
  const delta = current - previous;
  if (delta >= 2) return { label: "Much stronger than last time", tone: "up" };
  if (delta === 1) return { label: "Stronger than last time", tone: "up" };
  if (delta === 0) return { label: "About the same as last time", tone: "flat" };
  if (delta === -1) return { label: "Not as strong as last time", tone: "down" };
  return { label: "Weaker than last time", tone: "down" };
}

function Movement({
  substance,
  delivery,
}: {
  substance: ReturnType<typeof movement>;
  delivery: ReturnType<typeof movement>;
}) {
  if (!substance && !delivery) return null;

  const tone = (t: "up" | "flat" | "down") =>
    t === "up" ? "text-spoken" : t === "down" ? "text-flag" : "text-ash";

  return (
    <div className="mt-4 flex flex-col gap-1">
      {substance && (
        <p className={`font-body text-[15px] ${tone(substance.tone)}`}>
          What you said: {substance.label.toLowerCase()}
        </p>
      )}
      {delivery && (
        <p className={`font-body text-[15px] ${tone(delivery.tone)}`}>
          How you said it: {delivery.label.toLowerCase()}
        </p>
      )}
    </div>
  );
}

export function PracticeRunner({ questions }: { questions: RunnerQuestion[] }) {
  // Start on the first unanswered question, so returning to a session
  // picks up where it was left rather than at the beginning.
  const firstUnanswered = questions.findIndex((q) => q.attempts.length === 0);
  const [index, setIndex] = useState(
    firstUnanswered === -1 ? 0 : firstUnanswered,
  );
  const [started, setStarted] = useState(
    questions.some((q) => q.attempts.length > 0),
  );

  if (!started) {
    return (
      <div className="rise">
        <h1 className="text-parchment font-display text-4xl">
          Before you start
        </h1>

        <div className="border-rule mt-8 flex flex-col gap-5 border-t pt-8">
          <p className="text-parchment font-body text-base leading-relaxed">
            Don&rsquo;t overthink your answers, and don&rsquo;t over-practise.
            The goal is to train how you think when you&rsquo;re put on the
            spot.
          </p>
          <p className="text-ash font-body text-sm leading-relaxed">
            One question at a time. You&rsquo;ll get five seconds after each
            one appears, then recording starts on its own. Aim for 60 to 90
            seconds. A messy honest answer teaches you more than a polished
            rehearsed one.
          </p>
          <p className="text-ash font-body text-sm leading-relaxed">
            You can stop early, listen back, and try again after the feedback.
          </p>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="bg-parchment text-ink font-body hover:bg-parchment/85 mt-10 rounded-sm px-5 py-3 text-sm font-medium transition-colors"
        >
          Start · {questions.length} questions
        </button>
      </div>
    );
  }

  const question = questions[index];
  if (!question) return null;

  const attempts = question.attempts;
  const latest = attempts[attempts.length - 1];
  const answered = attempts.length > 0;
  const isLast = index === questions.length - 1;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          {index + 1} of {questions.length}
        </span>
        <span className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          {question.type === "technical" ? "Technical" : "Situational"}
        </span>
      </div>

      <div className="bg-rule mt-3 h-px w-full">
        <div
          className="bg-lamp h-px transition-all duration-500"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div key={question.linkId} className="rise mt-12">
        {question.context && (
          <p className="text-ash font-body text-sm italic">
            {question.context}
          </p>
        )}

        <p className="text-parchment font-display mt-3 text-[28px] leading-9">
          {question.body}
        </p>

        {attempts.map((attempt, i) => (
          <div key={attempt.id} className="border-rule/60 mt-10 border-l-2 pl-5">
            <p className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
              Attempt {attempt.attempt_number}
            </p>

            <Movement
              substance={movement(
                attempt.scores?.substance?.score,
                attempts[i - 1]?.scores?.substance?.score,
              )}
              delivery={movement(
                attempt.scores?.delivery?.score,
                attempts[i - 1]?.scores?.delivery?.score,
              )}
            />

            {attempt.feedback && (
              <p className="text-parchment font-body mt-5 text-sm leading-relaxed">
                {attempt.feedback}
              </p>
            )}

            {attempt.scores?.delivery && (
              <p className="text-ash font-body mt-4 text-xs leading-relaxed">
                {attempt.scores.delivery.filler_words ?? 0} filler words
                {attempt.scores.words_per_minute
                  ? `, ${attempt.scores.words_per_minute} words per minute`
                  : ""}
                {attempt.scores.delivery.hedging?.length
                  ? `. Hedging: ${attempt.scores.delivery.hedging.join(", ")}`
                  : ""}
              </p>
            )}

            <p className="text-ash/70 font-body mt-4 text-xs leading-relaxed">
              Efata can get things wrong, including facts about your field.
              Double-check anything technical before you repeat it to a client.
            </p>

            <FeedbackRating
              attemptId={attempt.id}
              existing={attempt.rated ? { useful: true, issue: null } : null}
            />
          </div>
        ))}

        <RetryPanel
          sessionQuestionId={question.linkId}
          attemptNumber={attempts.length + 1}
          hasAttempted={answered}
          rated={latest ? latest.rated : true}
          improvedAnswer={latest?.improved_answer ?? null}
          scriptOverlap={latest?.scores?.script_overlap ?? null}
          oneThing={latest?.scores?.one_thing ?? null}
        />
      </div>

      {answered && (
        <div className="border-rule mt-14 flex items-center justify-between gap-4 border-t pt-6">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors disabled:opacity-30"
          >
            Previous
          </button>

          {isLast ? (
            <Link
              href={`/practice`}
              className="bg-parchment text-ink font-body hover:bg-parchment/85 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Finish session
            </Link>
          ) : (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="bg-parchment text-ink font-body hover:bg-parchment/85 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Next question
            </button>
          )}
        </div>
      )}

      <p className="text-ash/60 font-body mt-10 text-xs">
        <Link
          href={`/recall`}
          className="hover:text-parchment underline underline-offset-4 transition-colors"
        >
          Had a real interview? Log what they asked
        </Link>
      </p>
    </div>
  );
}
