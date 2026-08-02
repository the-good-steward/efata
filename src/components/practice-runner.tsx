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

function Score({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
        {label}
      </span>
      <span className="text-parchment font-display text-2xl tabular-nums">
        {value}
        <span className="text-ash text-sm">/5</span>
      </span>
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
          className="bg-parchment text-ink font-body hover:bg-gold mt-10 rounded-sm px-5 py-3 text-sm font-medium transition-colors"
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
        <span className="text-ash font-body text-xs tracking-[0.3em] uppercase">
          {index + 1} of {questions.length}
        </span>
        <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
          {question.type === "technical" ? "Technical" : "Situational"}
        </span>
      </div>

      <div className="bg-rule mt-3 h-px w-full">
        <div
          className="bg-gold h-px transition-all duration-500"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div key={question.linkId} className="rise mt-12">
        {question.context && (
          <p className="text-ash font-body text-sm italic">
            {question.context}
          </p>
        )}

        <p className="text-parchment font-display mt-3 text-2xl leading-relaxed">
          {question.body}
        </p>

        {attempts.map((attempt) => (
          <div key={attempt.id} className="border-rule/60 mt-10 border-l-2 pl-5">
            <p className="text-ash font-body text-xs tracking-[0.2em] uppercase">
              Attempt {attempt.attempt_number}
            </p>

            <div className="mt-4 flex flex-wrap gap-8">
              <Score label="Substance" value={attempt.scores?.substance?.score} />
              <Score label="Delivery" value={attempt.scores?.delivery?.score} />
            </div>

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
              className="bg-parchment text-ink font-body hover:bg-gold rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Finish session
            </Link>
          ) : (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="bg-parchment text-ink font-body hover:bg-gold rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
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
