import type { PracticeDays } from "@/lib/practice-days";

/**
 * Fourteen small marks, one per day.
 *
 * Lamp is the brand's progress colour and this is the only place it
 * appears, which is why it can carry meaning without a label. A missed
 * day is a faint mark rather than a gap, so the row reads as a record
 * of what happened rather than a list of failures.
 */
export function PracticeDaysStrip({ data }: { data: PracticeDays }) {
  return (
    <section className="bg-raised rounded-[16px] p-5">
      <p className="ef-label text-ink-3">Days practised</p>

      <p className="font-serif text-ink mt-2 text-[28px] leading-none tabular-nums">
        {data.daysPractised}
        <span className="text-ink-3 text-[17px]"> of the last {data.window}</span>
      </p>

      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {data.days.map((day) => (
          <span
            key={day.date}
            className={`h-6 flex-1 rounded-[3px] ${
              day.practised ? "bg-lamp" : "bg-track"
            }`}
          />
        ))}
      </div>

      <p className="ef-body text-ink-2 mt-4">{data.note}</p>
    </section>
  );
}
