// Screen 11 of 16. One paragraph of plain-English read. The counts sit one tap
// further in, behind a link that already carries the numbers — so nobody taps
// to find out whether tapping was worth it.
import { Screen, Eyebrow, Primary, Quiet, SessionBar } from "./Chrome";

export default function WhatItCostYou({
  index,
  total,
  read,
  talkingPoints,
  fillerCount,
  wpm,
  nextLabel,
  onCounts,
  onBack,
  onContinue,
  onLeave,
}: {
  index: number;
  total: number;
  read: string;
  /** What the retry should cover. Never the words to say. */
  talkingPoints?: string[];
  fillerCount: number;
  wpm: number;
  /** "You already have this" when a CV match exists, otherwise "Say it again". */
  nextLabel: string;
  onCounts?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={
        <div className="flex flex-col gap-3">
          <Primary label={nextLabel} onClick={onContinue} />
          <Quiet label="Back" onClick={onBack} />
        </div>
      }
    >
      <Eyebrow>What it cost you</Eyebrow>
      <p className="font-serif text-[26px] leading-[1.5] text-ink text-pretty md:text-[34px]">{read}</p>
      {talkingPoints && talkingPoints.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="text-[13px] uppercase tracking-[0.14em] text-ink-3">
            Cover this next time
          </div>
          <ul className="flex flex-col gap-2.5">
            {talkingPoints.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[17px] leading-[1.5] text-ink md:text-[19px]"
              >
                <span aria-hidden="true" className="text-sea">
                  ·
                </span>
                <span className="text-pretty">{point}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] leading-relaxed text-ink-3 text-pretty md:text-[15px]">
            What to cover, not what to say. The words have to be yours or they
            will not be there when the client asks the next question.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onCounts}
        className="min-h-11 self-start border-b border-edge pb-1 text-[16px] text-sea md:text-[17px]"
      >
        {fillerCount} fillers · {wpm} wpm — see the counts
      </button>
    </Screen>
  );
}
