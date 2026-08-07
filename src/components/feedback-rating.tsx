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
      <p className="text-ink-3 font-body mt-5 text-xs">
        Noted.{" "}
        <button
          onClick={() => setShowIssues(true)}
          className="hover:text-ink underline underline-offset-4 transition-colors"
        >
          Change it
        </button>
      </p>
    );
  }

  return (
    <div className="border-hairline/60 mt-5 border-t pt-4">
      <p className="ef-caption text-ink-3">
        Did this feedback tell you something you can use?
      </p>
      <p className="ef-caption text-ink-3/70">
        Asked once a session, not every time.
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
            className="border-edge text-ink font-body hover:border-spoken hover:text-seaglass rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
          >
            Yes
          </button>
        </form>

        <button
          onClick={() => setShowIssues(true)}
          className="border-edge text-ink font-body hover:border-spoken hover:text-seaglass rounded-sm border px-3 py-1.5 text-xs transition-colors"
        >
          Not really
        </button>
      </div>

      {showIssues && (
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="attempt_id" value={attemptId} />
          <input type="hidden" name="useful" value="no" />

          <p className="text-ink-3 font-body text-xs">What was off about it?</p>

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
                <span className="border-hairline text-ink-3 peer-checked:border-spoken peer-checked:text-ink font-body block rounded-sm border px-3 py-1.5 text-xs transition-colors">
                  {issue.label}
                </span>
              </label>
            ))}
          </div>

          <input
            type="text"
            name="note"
            placeholder="Optional: what should it have said?"
            className="border-edge text-ink placeholder:text-ink-3/60 focus:border-spoken rounded-sm border bg-transparent px-3 py-1.5 font-body text-xs outline-none"
          />

          <button
            type="submit"
            disabled={pending}
            className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
      )}

      {state.error && (
        <p className="font-body mt-2 text-xs text-clay">{state.error}</p>
      )}
    </div>
  );
}
