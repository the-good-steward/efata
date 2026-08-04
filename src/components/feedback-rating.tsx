"use client";

import { useActionState, useOptimistic, useState, startTransition } from "react";
import {
  rateFeedback,
  type FeedbackState,
} from "@/app/practice/[sessionId]/feedback-actions";

const ISSUES = [
  { value: "wrong_facts", label: "It got something wrong about the work" },
  { value: "misunderstood", label: "It missed what I actually said" },
  { value: "transcript_wrong", label: "It misheard my words" },
  { value: "too_harsh", label: "It felt unfair" },
  { value: "too_generic", label: "Too vague to act on" },
  { value: "other", label: "Something else" },
];

export function FeedbackRating({
  attemptId,
  existing,
}: {
  attemptId: string;
  existing: { useful: boolean; issue: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(
    rateFeedback,
    {},
  );
  const [showIssues, setShowIssues] = useState(false);
  const [answered, setAnswered] = useOptimistic(
    Boolean(existing),
    (_current, next: boolean) => next,
  );

  if ((answered || existing || state.ok) && !showIssues) {
    return (
      <p className="text-ash font-body mt-5 text-xs">
        Noted.{" "}
        <button
          onClick={() => setShowIssues(true)}
          className="hover:text-parchment underline underline-offset-4 transition-colors"
        >
          Change it
        </button>
      </p>
    );
  }

  return (
    <div className="border-rule/60 mt-5 border-t pt-4">
      <p className="ef-caption text-ink-3">
        Did this feedback tell you something you can use?
      </p>
      <p className="ef-caption text-ink-3/70">
        Asked twice a session, not every time.
      </p>

      <div className="mt-3 flex gap-2">
        <form
          action={(formData) => {
            startTransition(() => setAnswered(true));
            formAction(formData);
          }}
        >
          <input type="hidden" name="attempt_id" value={attemptId} />
          <input type="hidden" name="useful" value="yes" />
          <button
            type="submit"
            disabled={pending}
            className="border-rule text-parchment font-body hover:border-spoken hover:text-spoken rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
          >
            Yes
          </button>
        </form>

        <button
          onClick={() => setShowIssues(true)}
          className="border-rule text-parchment font-body hover:border-spoken hover:text-spoken rounded-sm border px-3 py-1.5 text-xs transition-colors"
        >
          Not really
        </button>
      </div>

      {showIssues && (
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="attempt_id" value={attemptId} />
          <input type="hidden" name="useful" value="no" />

          <p className="text-ash font-body text-xs">What was off about it?</p>

          <div className="flex flex-col gap-1.5">
            {ISSUES.map((issue) => (
              <label key={issue.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="issue"
                  value={issue.value}
                  required
                  className="peer sr-only"
                />
                <span className="border-rule text-ash peer-checked:border-spoken peer-checked:text-parchment font-body block rounded-sm border px-3 py-1.5 text-xs transition-colors">
                  {issue.label}
                </span>
              </label>
            ))}
          </div>

          <input
            type="text"
            name="note"
            placeholder="Optional: what should it have said?"
            className="border-rule text-parchment placeholder:text-ash/50 focus:border-spoken rounded-sm border bg-transparent px-3 py-1.5 font-body text-xs outline-none"
          />

          <button
            type="submit"
            disabled={pending}
            className="bg-parchment text-ink font-body hover:bg-parchment/85 self-start rounded-sm px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
      )}

      {state.error && (
        <p className="font-body mt-2 text-xs text-flag">{state.error}</p>
      )}
    </div>
  );
}
