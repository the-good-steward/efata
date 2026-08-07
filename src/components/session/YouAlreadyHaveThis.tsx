// Screen 13 of 16. Shown only when the CV contains something the answer left
// out. Sits immediately before the retry, so it is the last thing read before
// speaking again. Reminding, never correcting — and never a suggestion to
// claim experience that is not already on the CV.
import { Screen, Eyebrow, Primary, SessionBar } from "./Chrome";

export interface CvMatch {
  /** Their own words, quoted back. */
  said: string;
  /** What the CV already contains. */
  have: string;
  /** Where on the CV it came from — role, employer, dates. */
  source: string;
  /** One instruction. */
  act: string;
}

export default function YouAlreadyHaveThis({
  index,
  total,
  match,
  onContinue,
  onLeave,
}: {
  index: number;
  total: number;
  match: CvMatch;
  onContinue?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={<Primary label="Say it again" onClick={onContinue} />}
    >
      <Eyebrow>You already have this</Eyebrow>
      <p className="text-[16px] leading-relaxed text-ink-3 text-pretty md:text-[17px]">You said {match.said}</p>
      <p className="font-serif text-[27px] leading-[1.45] text-sea text-pretty md:text-[34px]">{match.have}</p>
      <div className="flex items-baseline gap-3 rounded-xl bg-card px-4 py-3.5 md:px-5 md:py-4">
        <span className="shrink-0 text-[12px] uppercase tracking-[0.14em] text-ink-3">On your CV</span>
        <span className="text-[15px] leading-snug text-ink-2 md:text-[16px]">{match.source}</span>
      </div>
      <p className="text-[17px] leading-[1.7] text-ink md:text-[19px]">{match.act}</p>
      <p className="max-w-[66ch] text-[14px] leading-relaxed text-ink-3 text-pretty md:text-[15px]">
        We only point at what your own CV already says. Nothing here is invented, and nothing is claimed for you.
      </p>
    </Screen>
  );
}
