// Screen 12 of 16. Optional, one tap in. Counts, never scores.
import { Screen, Secondary, SessionBar } from "./Chrome";

export default function TheCounts({
  index,
  total,
  fillerCount,
  takeLength,
  wpm,
  wpmNote = "words per minute",
  phrases,
  onBack,
  onLeave,
}: {
  index: number;
  total: number;
  fillerCount: number;
  takeLength: string;
  wpm: number;
  wpmNote?: string;
  phrases: string[];
  onBack?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={<Secondary label="Back" onClick={onBack} />}
    >
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-card p-5 md:p-6">
          <div className="font-serif text-[30px] text-ink md:text-[34px]">{fillerCount}</div>
          <div className="text-[14px] leading-snug text-ink-2 md:text-[15px]">filler words in {takeLength}</div>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-card p-5 md:p-6">
          <div className="font-serif text-[30px] text-ink md:text-[34px]">{wpm}</div>
          <div className="text-[14px] leading-snug text-ink-2 md:text-[15px]">{wpmNote}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="text-[13px] uppercase tracking-[0.14em] text-ink-3">The words you reached for</div>
        <div className="flex flex-wrap gap-2.5">
          {phrases.map((p) => (
            <span key={p} className="rounded-full border border-clay-edge px-3.5 py-2.5 text-[15px] text-clay">
              {p}
            </span>
          ))}
        </div>
      </div>

      <p className="max-w-[60ch] text-[14px] leading-relaxed text-ink-3 text-pretty md:text-[15px]">
        Counts, not scores. They&rsquo;re here for the trend across sessions, not for this one answer.
      </p>
    </Screen>
  );
}
