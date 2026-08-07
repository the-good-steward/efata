"use client";

import { useActionState } from "react";
import {
  saveCalibration,
  checkStability,
  type CalibrateState,
  type StabilityState,
} from "@/app/calibrate/actions";

type Props = {
  attemptId: string;
  question: string;
  rubric: string;
  transcript: string;
  efata: { substance: number; delivery: number } | null;
  mine: { substance: number; delivery: number; note: string | null } | null;
};

function ScorePicker({ name, label }: { name: string; label: string }) {
  return (
    <fieldset className="flex items-center gap-3">
      <legend className="sr-only">{label}</legend>
      <span className="text-ink-3 font-body w-24 text-[13px] font-semibold tracking-[0.18em] uppercase">
        {label}
      </span>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={n}
            required
            className="peer sr-only"
          />
          <span className="border-hairline text-ink-3 peer-checked:border-spoken peer-checked:text-ink peer-checked:bg-seaglass font-body flex h-9 w-9 items-center justify-center rounded-sm border text-sm transition-colors">
            {n}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function CalibrationCard(props: Props) {
  const [state, formAction, pending] = useActionState<CalibrateState, FormData>(
    saveCalibration,
    {},
  );
  const [stability, stabilityAction, checking] = useActionState<
    StabilityState,
    FormData
  >(checkStability, {});

  const scored = Boolean(props.mine);

  return (
    <li className="border-hairline border-t pt-8">
      <span className="text-ink-3 font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
        {props.rubric}
      </span>

      <p className="text-ink font-display mt-3 text-lg leading-relaxed">
        {props.question}
      </p>

      <details className="mt-4">
        <summary className="text-ink-3 font-body cursor-pointer text-sm underline underline-offset-4">
          Read the transcript
        </summary>
        <p className="text-ink/80 font-body border-hairline mt-3 border-l pl-4 text-sm leading-relaxed">
          {props.transcript}
        </p>
      </details>

      {!scored ? (
        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="attempt_id" value={props.attemptId} />

          <p className="text-ink-3 font-body text-sm">
            Score it yourself first. Efata&rsquo;s scores stay hidden until you
            do.
          </p>

          <ScorePicker name="human_substance" label="Substance" />
          <ScorePicker name="human_delivery" label="Delivery" />

          <input
            type="text"
            name="note"
            placeholder="Optional: what stood out?"
            className="border-edge text-ink placeholder:text-ink-3/60 focus:border-spoken rounded-sm border bg-transparent px-3 py-2 font-body text-sm outline-none"
          />

          {state.error && (
            <p role="alert" className="font-body text-sm text-clay">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save my score and reveal"}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <table className="font-body w-full max-w-sm text-sm">
            <thead>
              <tr className="text-ink-3 text-[13px] font-semibold tracking-[0.18em] uppercase">
                <th className="pb-2 text-left font-normal"> </th>
                <th className="pb-2 text-right font-normal">You</th>
                <th className="pb-2 text-right font-normal">Efata</th>
                <th className="pb-2 text-right font-normal">Diff</th>
              </tr>
            </thead>
            <tbody className="text-ink tabular-nums">
              {(
                [
                  ["Substance", props.mine!.substance, props.efata?.substance],
                  ["Delivery", props.mine!.delivery, props.efata?.delivery],
                ] as const
              ).map(([label, mine, efata]) => {
                const diff = efata != null ? efata - mine : null;
                return (
                  <tr key={label} className="border-hairline/60 border-t">
                    <td className="text-ink-3 py-2">{label}</td>
                    <td className="py-2 text-right">{mine}</td>
 <td className="py-2 text-right">{efata ?? ", "}</td>
                    <td
                      className={`py-2 text-right ${
                        diff == null || diff === 0
                          ? "text-ink-3"
                          : Math.abs(diff) === 1
                            ? "text-lamp"
                            : "text-clay"
                      }`}
                    >
 {diff == null ? ", " : diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {props.mine!.note && (
            <p className="text-ink-3 font-body mt-3 text-xs italic">
              {props.mine!.note}
            </p>
          )}

          <form action={stabilityAction} className="mt-5">
            <input type="hidden" name="attempt_id" value={props.attemptId} />
            <button
              type="submit"
              disabled={checking}
              className="text-ink-3 font-body hover:text-ink text-sm underline underline-offset-4 transition-colors disabled:opacity-60"
            >
              {checking
                ? "Re-scoring three times…"
                : "How stable is this score?"}
            </button>
          </form>

          {stability.runs && (
            <p className="text-ink-3 font-body mt-3 text-xs">
 Same transcript, three fresh runs, substance{" "}
              {stability.runs.map((r) => r.substance).join(", ")}; delivery{" "}
              {stability.runs.map((r) => r.delivery).join(", ")}.
            </p>
          )}
          {stability.error && (
            <p className="font-body mt-3 text-xs text-clay">
              {stability.error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
