"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSession, type SessionState } from "@/app/practice/actions";

/**
 * Not a progress bar — the steps are not measurable and a bar that
 * stalls at 80% is worse than none. These describe the work.
 */
const STEPS = [
  "Reading the job post",
  "Looking up what this role is actually asked",
  "Working out what they'd test you on",
  "Writing your questions",
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
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (state.sessionId) router.push(`/practice/${state.sessionId}`);
  }, [state.sessionId, router]);

  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      setTicks((t) => t + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, [pending]);

  const step = pending ? Math.min(ticks, STEPS.length - 1) : 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          Paste the job post
        </span>
        <textarea
          name="job_post"
          rows={10}
          required
          placeholder="Paste the full listing from OnlineJobs.ph, Upwork, LinkedIn, or a client's brief. The more detail, the sharper the questions."
          className="border-rule text-parchment placeholder:text-ash/50 focus:border-spoken focus:ring-spoken/40 resize-y rounded-sm border bg-transparent px-3 py-2 font-body text-sm leading-relaxed outline-none focus:ring-2"
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="font-body rounded-sm border border-flag/40 bg-flag/10 px-3 py-2 text-sm text-flag"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-parchment text-ink font-body hover:bg-parchment/85 focus-visible:ring-spoken focus-visible:ring-offset-ink self-start rounded-sm px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {pending ? "Researching and building…" : "Build my questions"}
      </button>

      {pending && (
        <div className="bg-raised mt-2 rounded-[12px] p-5">
          <div className="flex items-center gap-3">
            <span className="bg-seaglass inline-block h-2 w-2 animate-pulse rounded-full" />
            <p className="ef-ui text-paper">{STEPS[step]}</p>
          </div>
          <p className="ef-caption text-faint mt-3">
            Up to a minute. It&rsquo;s reading what employers actually ask
            for this role, not guessing.
          </p>
        </div>
      )}
    </form>
  );
}
