"use client";

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
}: {
  id: string;
  move: string;
  why: string;
  prompt: string;
  doneToday: boolean;
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

      {doneToday && (
        <p className="ef-caption text-ink-3 mt-3 text-center">
          You have already done one today. Another is fine.
        </p>
      )}
    </div>
  );
}
