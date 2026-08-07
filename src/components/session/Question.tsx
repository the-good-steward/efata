// Screen 6 of 16. The question and nothing else.
import { Screen, Eyebrow, Primary, SessionBar } from "./Chrome";

export type Category = "Situational" | "Technical";

export default function Question({
  index,
  total,
  category,
  question,
  why,
  onReady,
  onLeave,
}: {
  index: number;
  total: number;
  category: Category;
  question: string;
  why: string;
  onReady?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={
        <div className="flex flex-col items-center gap-4">
          <span className="text-[15px] text-ink-3">Aim for 60 to 90 seconds</span>
          <Primary label="I'm ready" onClick={onReady} />
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <Eyebrow>{category}</Eyebrow>
        <h1 className="font-serif text-[34px] leading-[1.32] text-pretty md:text-[48px]">{question}</h1>
        <p className="max-w-[56ch] text-[16px] leading-[1.7] text-ink-3 text-pretty md:text-[18px]">{why}</p>
      </div>
    </Screen>
  );
}
