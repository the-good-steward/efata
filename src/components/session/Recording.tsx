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
  /**
   * There is no beep, on purpose: the brand rules it out, and a tone
   * playing as the microphone opens lands on the recording itself.
   *
   * So the fact of being live is carried visually instead, and by more
   * than one signal at once. The ground turns dusk, a dot pulses, the
   * label reads "Recording now" rather than the ambiguous "Listening",
   * the timer starts moving, and for the first few seconds a line
   * confirms it in words. Nobody should have to wonder.
   */
  const justStarted = elapsedSeconds < 4;
  const mmss = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  const pct = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  return (
    <Screen
      ground="dusk"
      header={
        <div className="flex flex-col items-center gap-2 pt-8">
          <div className="flex items-center gap-2.5">
            <LiveDot dusk />
            <Eyebrow tone="sea-dusk">Recording now</Eyebrow>
          </div>
          {justStarted ? (
            <p className="animate-rise text-[14px] text-dusk-3">
              Go ahead, we can hear you
            </p>
          ) : null}
        </div>
      }
      footer={<Primary label="Done" dusk onClick={onDone} />}
    >
      <div className="flex flex-col items-center gap-8">
        <h2 className="font-serif text-[30px] leading-[1.32] text-dusk-1 text-pretty md:text-[40px]">{question}</h2>
        {coachingLine ? <p className="text-[17px] leading-relaxed text-sea-dusk md:text-[19px]">→ {coachingLine}</p> : null}
        <div className="flex w-full flex-col gap-3.5">
          <div
            className={`text-center font-serif text-[52px] tabular-nums md:text-[64px] ${
              justStarted ? "text-sea-dusk" : "text-paper"
            }`}
          >
            {mmss}
          </div>
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
