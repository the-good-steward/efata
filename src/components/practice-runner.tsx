"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RetryPanel } from "@/components/retry-panel";
import { FeedbackRating } from "@/components/feedback-rating";
import { MarkedTranscript } from "@/components/marked-transcript";
import { buildVerdict, type SessionAnswer } from "@/lib/session-verdict";

export type RunnerQuestion = {
  linkId: string;
  body: string;
  context: string | null;
  type: string;
  attempts: {
    id: string;
    attempt_number: number;
    created_at: string;
    transcript: string | null;
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
  const [finished, setFinished] = useState(false);

  /**
   * Anchor for the question itself.
   *
   * Feedback and the recorder both appear below the question, so
   * without this the page silently leaves you looking at whatever was
   * on screen before — usually the bottom of the previous block, with
   * the thing you just asked for out of view above or below you.
   */
  const anchorRef = useRef<HTMLDivElement>(null);

  // Bring the question back into view when it changes. Without it,
  // moving on leaves you staring at the footer of the previous answer.
  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

  /**
   * Briefly lock navigation after new feedback lands.
   *
   * Submitting an answer inserts a block of feedback above the Back and
   * Next controls, so everything below it jumps. A tap already on its
   * way down lands on whatever moved into that spot, which is how
   * people ended up on the next question without choosing to be there.
   * Half a second is enough to cover the reflow and short enough that
   * nobody deliberately tapping Next will notice.
   */
  const totalAttempts = questions.reduce((n, q) => n + q.attempts.length, 0);
  const [navLocked, setNavLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // A ticking clock, so "has the feedback stalled" can be derived
  // without reading the current time during render.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);
  const seenAttempts = useRef(totalAttempts);

  useEffect(() => {
    if (totalAttempts === seenAttempts.current) return;
    seenAttempts.current = totalAttempts;
    setNavLocked(true);
    const timer = setTimeout(() => setNavLocked(false), 500);
    return () => clearTimeout(timer);
  }, [totalAttempts]);
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
          <p className="ef-body text-paper-soft">
            Nothing here is scored. Nobody else hears these.
          </p>
          <p className="ef-body text-muted">
            One question at a time. Five seconds after each one appears,
            recording starts on its own. Aim for 60 to 90 seconds.
          </p>
          <p className="text-ash font-body text-sm leading-relaxed">
            You can stop early, listen back, and try again after the feedback.
          </p>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="bg-paper text-dusk mt-10 w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90"
        >
          Start · {questions.length} questions
        </button>
      </div>
    );
  }

  if (finished) {
    const answeredCount = questions.filter((q) => q.attempts.length > 0).length;
    const retried = questions.filter((q) => q.attempts.length > 1).length;
    // Answered once and left there: they did the hard part and stopped
    // one step short of the thing worth having.
    const sessionAnswers: SessionAnswer[] = questions
      .filter((q) => q.attempts.length > 0)
      .map((q) => {
        const first = q.attempts[0];
        const last = q.attempts[q.attempts.length - 1];
        return {
          attemptCount: q.attempts.length,
          fillerWords: last.scores?.delivery?.filler_words ?? 0,
          wordCount: (last.transcript ?? "").trim()
            ? (last.transcript ?? "").trim().split(/\s+/).length
            : 0,
          wordsPerMinute: last.scores?.words_per_minute ?? null,
          substanceFirst: first.scores?.substance?.score ?? null,
          substanceLast: last.scores?.substance?.score ?? null,
          hedging: last.scores?.delivery?.hedging ?? [],
        };
      });

    const verdict = buildVerdict(sessionAnswers, questions.length);

    const unfinished = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.attempts.length === 1);
    const fillers = questions
      .flatMap((q) => q.attempts)
      .map((a) => a.scores?.delivery?.filler_words ?? 0);
    const firstFillers = fillers[0];
    const lastFillers = fillers[fillers.length - 1];

    const hedges = new Map<string, number>();
    for (const q of questions) {
      for (const a of q.attempts) {
        for (const h of a.scores?.delivery?.hedging ?? []) {
          const key = h.trim().toLowerCase();
          if (key) hedges.set(key, (hedges.get(key) ?? 0) + 1);
        }
      }
    }
    const topHedges = [...hedges.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return (
      <div className="rise">
        <p className="ef-label text-faint">Session finished</p>
        <h1 className="ef-display text-paper mt-3">{verdict.headline}</h1>
        <p className="ef-body text-paper-soft mt-4">{verdict.body}</p>
        <p className="ef-caption text-faint mt-4">
          {answeredCount} of {questions.length} answered
          {retried > 0 ? ` · ${retried} with a second run` : ""}
        </p>

        {answeredCount === 0 && (
          <div className="border-clay/40 bg-clay/10 mt-6 rounded-[12px] px-4 py-3">
            <p className="ef-body text-clay">
              Nothing was recorded. If you spoke and it never came back with
              feedback, that is a fault at our end, not yours — the questions
              are still here and worth another go.
            </p>
          </div>
        )}

        <div className="border-hairline mt-8 flex flex-col gap-5 border-t pt-8">
          {retried > 0 && (
            <p className="ef-body text-paper-soft">
              You went back and did {retried}{" "}
              {retried === 1 ? "question" : "questions"} a second time. That
              second run is where the change actually happens.
            </p>
          )}

          {topHedges.length > 0 && (
            <div>
              <p className="ef-label text-faint">What you reached for</p>
              <ul className="mt-3 flex flex-col gap-1">
                {topHedges.map(([phrase, count]) => (
                  <li key={phrase} className="ef-body text-paper">
                    &ldquo;{phrase}&rdquo;{" "}
                    <span className="text-faint">
                      · {count} {count === 1 ? "time" : "times"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="ef-caption text-faint mt-3">
                Catching one of these mid-sentence on a real call is the whole
                skill. You do not need to fix all of them.
              </p>
            </div>
          )}

          {firstFillers != null && lastFillers != null && fillers.length > 2 && (
            <p className="ef-body text-paper-soft">
              You started at {firstFillers} filler words and finished at{" "}
              {lastFillers}.
            </p>
          )}
        </div>

        {unfinished.length > 0 && (
          <div className="border-seaglass/25 bg-seaglass/5 mt-8 rounded-[16px] p-5">
            <p className="ef-ui text-seaglass">
              {unfinished.length === 1
                ? "One question still has words waiting"
                : `${unfinished.length} questions still have words waiting`}
            </p>
            <p className="ef-body text-muted mt-2">
              You answered {unfinished.length === 1 ? "it" : "them"} once. A
              second run unlocks the exact wording for that answer, which is
              the part you can take into a real call.
            </p>
            <button
              onClick={() => {
                setFinished(false);
                setIndex(unfinished[0].i);
              }}
              className="bg-paper text-dusk mt-5 w-full rounded-full px-6 py-3.5 text-[17px] font-semibold transition-opacity hover:opacity-90"
            >
              Go back to {unfinished.length === 1 ? "it" : "the first one"}
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/progress"
            className="bg-paper text-dusk block w-full rounded-full px-6 py-4 text-center text-[17px] font-semibold transition-opacity hover:opacity-90"
          >
            See how this compares
          </Link>
          <button
            onClick={() => {
              setFinished(false);
              setIndex(0);
            }}
            className="ef-ui text-muted hover:text-paper transition-colors"
          >
            Back to the questions
          </button>
          <Link
            href="/practice"
            className="ef-ui text-seaglass hover:text-paper text-center transition-colors"
          >
            {verdict.tone === "steady"
              ? "Practise a harder job post"
              : "Practise another set"}
          </Link>
          <Link
            href="/recall"
            className="ef-ui text-faint hover:text-paper text-center transition-colors"
          >
            Had a real interview? Log what they asked
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[index];
  if (!question) return null;

  const attempts = question.attempts;
  const latest = attempts[attempts.length - 1];
  const answered = attempts.length > 0;
  const isLast = index === questions.length - 1;
  // One answer is not practice. Moving on is blocked until the second
  // run is done, which is where the change actually happens.
  const owesRetry = attempts.length === 1;

  // Six ticks of fifteen seconds is a minute and a half — long enough
  // that a slow evaluation is not mistaken for a failed one.
  const stalled = Boolean(latest) && !latest?.feedback && now >= 6;

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

      <div ref={anchorRef} key={question.linkId} className="rise mt-12 scroll-mt-6">
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

            {attempt.transcript && (
              <div className="bg-raised mt-6 rounded-[16px] p-5">
                <p className="ef-label text-faint mb-4">What you said</p>
                <MarkedTranscript
                  transcript={attempt.transcript}
                  hedges={attempt.scores?.delivery?.hedging ?? []}
                />
              </div>
            )}

            {attempt.feedback && (
              <p className="ef-body text-paper mt-6">{attempt.feedback}</p>
            )}

            {attempt.scores?.delivery && (
              <div className="mt-6 flex gap-10">
                <div>
                  <p className="font-display text-paper text-[28px] tabular-nums">
                    {attempt.scores.delivery.filler_words ?? 0}
                  </p>
                  <p className="ef-caption text-faint">filler words</p>
                </div>
                {attempt.scores.words_per_minute && (
                  <div>
                    <p className="font-display text-paper text-[28px] tabular-nums">
                      {attempt.scores.words_per_minute}
                    </p>
                    <p className="ef-caption text-faint">
                      words per minute ·{" "}
                      {attempt.scores.words_per_minute > 190
                        ? "quick"
                        : attempt.scores.words_per_minute < 110
                          ? "slow"
                          : "steady"}
                    </p>
                  </div>
                )}
              </div>
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
          // Keyed on the attempt count so a confirmed new attempt
          // remounts this and clears its local state. Without it, the
          // recorder's own idea of where it was outlived the data.
          key={`${question.linkId}-${attempts.length}`}
          feedbackReady={Boolean(latest?.feedback)}
          feedbackStalled={stalled}
          onSubmittingChange={setSubmitting}
          sessionQuestionId={question.linkId}
          attemptNumber={attempts.length + 1}
          hasAttempted={answered}
          improvedAnswer={latest?.improved_answer ?? null}
          scriptOverlap={latest?.scores?.script_overlap ?? null}
          oneThing={latest?.scores?.one_thing ?? null}
        />
      </div>

      {!submitting && owesRetry && (
        <p className="ef-caption text-faint mt-8 text-center">
          One more run at this one before you move on.
        </p>
      )}

      <div
        className={`border-hairline mt-6 flex items-center justify-between gap-4 border-t pt-6 transition-opacity ${
          submitting ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || navLocked}
          className="ef-ui text-muted hover:text-paper inline transition-colors disabled:opacity-30"
        >
          Back
        </button>

        {isLast ? (
          <button
            onClick={() => setFinished(true)}
            disabled={navLocked || owesRetry}
            className="ef-ui text-muted hover:text-paper inline transition-colors disabled:opacity-30"
          >
            Finish session
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="ef-ui text-muted hover:text-paper inline transition-colors"
          >
            {!answered ? "Skip this one" : "Next question"}
          </button>
        )}
      </div>

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
