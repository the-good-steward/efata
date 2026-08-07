// Screen 15 of 16. The rewrite, and the only place it appears — withheld until
// the second attempt is done, so the second attempt cannot become recitation.
import { Screen, Eyebrow, Primary } from "./Chrome";

export default function YoursSaidStraight({
  index,
  total,
  rewrite,
  playing,
  isLastQuestion,
  onTogglePlay,
  onNext,
}: {
  index: number;
  total: number;
  rewrite: string;
  playing: boolean;
  isLastQuestion: boolean;
  onTogglePlay?: () => void;
  onNext?: () => void;
}) {
  return (
    <Screen
      ground="paper-quiet"
      header={
        <div className="px-6 pt-7 text-center text-[13px] uppercase tracking-[0.16em] text-ink-3 md:px-10">
          Question {index} of {total}
        </div>
      }
      footer={<Primary label={isLastQuestion ? "Finish the session" : "Next question"} onClick={onNext} />}
    >
      <div className="flex flex-col items-center gap-7 text-center">
        <Eyebrow>Yours, said straight</Eyebrow>
        <p className="font-serif text-[27px] leading-[1.45] text-sea text-pretty md:text-[38px]">{rewrite}</p>
        <p className="max-w-[52ch] text-[15px] leading-[1.65] text-ink-3 text-pretty md:text-[17px]">
          Same facts, same voice, softeners out. Say it out loud once before you move on.
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-12 items-center justify-center rounded-full border-[1.5px] border-sea text-[16px] text-sea"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="text-[15px] text-ink-2">Play it back at your pace</span>
        </div>
      </div>
    </Screen>
  );
}
