import type { PracticeDays } from "@/lib/practice-days";

/**
 * Fourteen marks, oldest on the left.
 *
 * A filled mark is a day with an answer in it. Gaps are just gaps, with
 * nothing to signal failure, because the whole reason for counting days
 * rather than a streak is that a missed day should not read as one.
 */
export function PracticeDaysStrip({ data }: { data: PracticeDays }) {
  return (
    <div className="bg-raised rounded-[16px] p-5">
      <p className="ef-label text-ink-3">Days practised</p>

      <p className="font-serif text-ink mt-2 text-[28px] leading-none tabular-nums">
        {data.days}
        <span className="text-ink-3 text-[17px]"> of the last {data.window}</span>
      </p>

      <div
        className="mt-4 flex gap-1.5"
        role="img"
        aria-label={`Practised on ${data.days} of the last ${data.window} days`}
      >
        {data.marks.map((filled, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 rounded-full ${
              filled ? "bg-lamp" : "bg-track"
            }`}
          />
        ))}
      </div>

      <p className="ef-body text-ink-2 mt-4">{data.note}</p>
    </div>
  );
}
