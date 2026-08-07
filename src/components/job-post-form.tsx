"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Working } from "@/components/working";
import { createSession, type SessionState } from "@/app/practice/actions";

/**
 * Not a progress bar — the steps are not measurable and a bar that
 * stalls at 80% is worse than none. These describe the work.
 */
const STEPS = [
  "Reading the job post",
  "Looking up what this role actually gets asked",
  "Working out what they would test you on",
  "Writing questions for your level",
  "Nearly there",
];

export function JobPostForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SessionState, FormData>(
    createSession,
    {},
  );

  /**
   * Generation takes up to a minute because it researches the role
   * before writing anything. A single frozen spinner for that long
   * reads as broken, so the steps say what is actually happening.
   */
  // Derived from elapsed time rather than held as state that an effect
  // writes to, which keeps the lint rule happy and the logic simpler.

  useEffect(() => {
    if (state.sessionId) router.push(`/practice/${state.sessionId}`);
  }, [state.sessionId, router]);

  /**
   * Stay in the waiting state through the navigation.
   *
   * `pending` goes false the moment the action returns, but the page
   * has not moved yet, so the form re-rendered and the button flashed
   * back for an instant before the questions appeared. Holding the
   * waiting state until the route actually changes removes that.
   */
  const working = pending || Boolean(state.sessionId);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-ink-3 font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          Paste the job post
        </span>
        <textarea
          name="job_post"
          rows={10}
          required
          placeholder="Paste the full listing from OnlineJobs.ph, Upwork, LinkedIn, or a client's brief. The more detail, the sharper the questions."
          className="border-edge text-ink placeholder:text-ink-3/60 focus:border-spoken focus:ring-spoken/40 resize-y rounded-sm border bg-transparent px-3 py-2 font-body text-sm leading-relaxed outline-none focus:ring-2"
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="ef-body border-clay/40 bg-clay/10 text-clay rounded-[12px] border px-4 py-3"
        >
          {state.error}
        </p>
      )}

      {working ? (
        <Working
          lines={state.sessionId ? ["Opening your questions"] : STEPS}
          note={
            state.sessionId
              ? "Ready."
              : "Up to a minute. It's reading what employers actually ask for this role, not guessing."
          }
        />
      ) : (
        <button
          type="submit"
          className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Build my questions
        </button>
      )}
    </form>
  );
}
