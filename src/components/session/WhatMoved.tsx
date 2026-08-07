// Screen 14 of 16. Replaces the written read on the second attempt. The two
// counts carry their previous values beside them — a difference, not a grade.
import { Screen, Eyebrow, Primary, SessionBar } from "./Chrome";

/**
 * Declared outside the screen rather than inside it: a component
 * created during render is a new component every time, which throws
 * away its state on each pass.
 */
function Stat({ now, was, label }: { now: number; was: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-2xl bg-card p-4 md:p-5">
      <div className="flex items-baseline gap-2.5">
        <span className="font-serif text-[28px] text-ink md:text-[32px]">{now}</span>
        <span className="text-[14px] text-ink-3 md:text-[15px]">was {was}</span>
      </div>
      <div className="text-[14px] leading-snug text-ink-2 md:text-[15px]">{label}</div>
    </div>
  );
}

export default function WhatMoved({
  index,
  total,
  summary,
  fillerCount,
  previousFillerCount,
  wpm,
  previousWpm,
  onContinue,
  onLeave,
}: {
  index: number;
  total: number;
  summary: string;
  fillerCount: number;
  previousFillerCount: number;
  wpm: number;
  previousWpm: number;
  onContinue?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={<Primary label="Hear it said better" onClick={onContinue} />}
    >
      <Eyebrow>What moved</Eyebrow>
      <p className="font-serif text-[26px] leading-[1.5] text-ink text-pretty md:text-[34px]">{summary}</p>
      <div className="flex gap-3">
        <Stat now={fillerCount} was={previousFillerCount} label="filler words" />
        <Stat now={wpm} was={previousWpm} label="words per minute" />
      </div>
    </Screen>
  );
}
