"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startDrill, type DrillState } from "@/app/drill/actions";

/**
 * The move leads, not the question.
 *
 * "Answer this well" is not something anyone can practise. "Say the
 * number, then stop talking" is, and naming it before they speak is
 * what makes a drill a drill rather than a shorter session.
 */
export function DrillCard({
  id,
  move,
  why,
  prompt,
  doneToday,
  skipHref,
}: {
  id: string;
  move: string;
  why: string;
  prompt: string;
  doneToday: boolean;
  /** Where a different drill lives, or null when there is only one. */
  skipHref?: string | null;
}) {
  const [state, formAction, pending] = useActionState<DrillState, FormData>(
    startDrill,
    {},
  );

  return (
    <div className="rise mt-4">
      <h1 className="ef-display text-ink">{move}</h1>
      <p className="ef-body text-ink-2 mt-3">{why}</p>

      <div className="bg-raised mt-8 rounded-[16px] p-5">
        <p className="ef-label text-ink-3">The question</p>
        <p className="ef-question text-ink mt-3">{prompt}</p>
      </div>

      {state.error && (
        <p role="alert" className="ef-body text-clay mt-4">
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-6">
        <input type="hidden" name="drill_id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Setting it up…" : doneToday ? "Do another" : "Start"}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2">
        {doneToday && (
          <p className="ef-caption text-ink-3">
            You have already done one today. Another is fine.
          </p>
        )}

        {skipHref && (
          <Link
            href={skipHref}
            className="text-ink-3 hover:text-ink text-[15px] underline underline-offset-4 transition-colors"
          >
            Show me a different one
          </Link>
        )}
      </div>
    </div>
  );
}
