// Screen 6 of 16. The question and nothing else.
import { Screen, Eyebrow, Primary, SessionBar } from "./Chrome";

export type Category = "Situational" | "Technical";

export default function Question({
  index,
  total,
  category,
  question,
  why,
  fromYourSituation = false,
  onReady,
  onLeave,
}: {
  index: number;
  total: number;
  category: Category;
  question: string;
  why: string;
  /** Their own situation, played back as the client's line. */
  fromYourSituation?: boolean;
  onReady?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={
        <div className="flex flex-col items-center gap-4">
          <span className="text-[15px] text-ink-3">
            A moment to gather yourself first
          </span>
          <Primary label="I'm ready" onClick={onReady} />
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <Eyebrow>{fromYourSituation ? "Your client says" : category}</Eyebrow>

        {fromYourSituation && (
          <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
            This is the moment you described. Answer it the way you would
            answer them.
          </p>
        )}
        <h1 className="font-serif text-[34px] leading-[1.32] text-pretty md:text-[48px]">{question}</h1>
        <p className="max-w-[56ch] text-[16px] leading-[1.7] text-ink-3 text-pretty md:text-[18px]">{why}</p>
      </div>
    </Screen>
  );
}
