// Screen 8 of 16. Dusk means "your turn". Coaching line only on attempt two.
import { Screen, Eyebrow, Primary, LiveDot } from "./Chrome";

export default function Recording({
  question,
  elapsedSeconds,
  targetSeconds = 90,
  coachingLine,
  onDone,
}: {
  question: string;
  elapsedSeconds: number;
  targetSeconds?: number;
  coachingLine?: string;
  onDone?: () => void;
}) {
  const mmss = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  const pct = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  return (
    <Screen
      ground="dusk"
      header={
        <div className="flex items-center justify-center gap-2.5 pt-8">
          <LiveDot dusk />
          <Eyebrow tone="sea-dusk">Listening</Eyebrow>
        </div>
      }
      footer={<Primary label="Done" dusk onClick={onDone} />}
    >
      <div className="flex flex-col items-center gap-8">
        <h2 className="font-serif text-[30px] leading-[1.32] text-dusk-1 text-pretty md:text-[40px]">{question}</h2>
        {coachingLine ? <p className="text-[17px] leading-relaxed text-sea-dusk md:text-[19px]">→ {coachingLine}</p> : null}
        <div className="flex w-full flex-col gap-3.5">
          <div className="text-center font-serif text-[52px] tabular-nums text-paper md:text-[64px]">{mmss}</div>
          <div className="h-0.5 overflow-hidden rounded-full bg-dusk-track">
            <div className="h-full bg-sea-dusk" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[15px] text-dusk-3">
            <span>Aim for 60 to 90 seconds</span>
            <span>1:30</span>
          </div>
        </div>
      </div>
    </Screen>
  );
}
