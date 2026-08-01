"use client";

import { useActionState } from "react";
import { createSession, type SessionState } from "@/app/practice/actions";

export function JobPostForm() {
  const [state, formAction, pending] = useActionState<SessionState, FormData>(
    createSession,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
          Paste the job post
        </span>
        <textarea
          name="job_post"
          rows={10}
          required
          placeholder="Paste the full listing from OnlineJobs.ph, Upwork, LinkedIn, or a client's brief. The more detail, the sharper the questions."
          className="border-rule text-parchment placeholder:text-ash/50 focus:border-gold focus:ring-gold/40 resize-y rounded-sm border bg-transparent px-3 py-2 font-body text-sm leading-relaxed outline-none focus:ring-2"
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="font-body rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-parchment text-ink font-body hover:bg-gold focus-visible:ring-gold focus-visible:ring-offset-ink self-start rounded-sm px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {pending ? "Building your questions…" : "Build my questions"}
      </button>

      {pending && (
        <p className="text-ash font-body text-xs">
          This takes about 15 seconds.
        </p>
      )}
    </form>
  );
}
