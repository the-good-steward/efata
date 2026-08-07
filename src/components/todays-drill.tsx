"use client";

import { useActionState } from "react";
import { startDrill, type DrillState } from "@/app/drill/actions";

/**
 * The drill, on the page people actually land on.
 *
 * Twelve people used the app and none did a drill, because it was a
 * tab nobody opened. It is the cheap daily half of the product and the
 * thing that brings someone back tomorrow, so it belongs here, above
 * the fold, next to the session rather than behind it.
 */
export function TodaysDrill({
  id,
  move,
  why,
  doneToday,
}: {
  id: string;
  move: string;
  why: string;
  doneToday: boolean;
}) {
  const [state, formAction, pending] = useActionState<DrillState, FormData>(
    startDrill,
    {},
  );

  return (
    <section className="border-seaglass/30 bg-quiet rounded-[16px] border p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="ef-label text-seaglass">Today&rsquo;s drill</p>
        <p className="ef-caption text-ink-3">3 minutes</p>
      </div>

      <h2 className="font-serif text-ink mt-3 text-[22px] leading-snug">
        {move}
      </h2>
      <p className="ef-body text-ink-2 mt-2">{why}</p>

      {state.error && (
        <p role="alert" className="ef-body text-clay mt-4">
          {state.error}
        </p>
      )}

      {doneToday ? (
        <p className="ef-caption text-ink-3 mt-4">
          Done today. A new one tomorrow.
        </p>
      ) : (
        <form action={formAction} className="mt-5">
          <input type="hidden" name="drill_id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="border-seaglass text-seaglass w-full rounded-full border px-6 py-3.5 text-[17px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {pending ? "Setting it up…" : "One question, out loud"}
          </button>
        </form>
      )}
    </section>
  );
}
