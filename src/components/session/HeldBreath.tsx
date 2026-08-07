// Screen 7 of 16. Five seconds. No digits, no ring, no beep. One line grows
// outward; when it reaches full width, recording has already started.
// Reduced motion holds the full line — the five seconds still has to pass.
import { Screen } from "./Chrome";

export default function HeldBreath({
  question,
  caption = "Take a breath.",
  durationMs = 5000,
}: {
  question: string;
  caption?: string;
  durationMs?: number;
}) {
  return (
    <Screen ground="dusk-deep">
      <div className="flex flex-col items-center gap-11">
        <h1 className="font-serif text-[34px] leading-[1.3] text-paper text-pretty md:text-[48px]">{question}</h1>
        <div className="flex w-full flex-col items-center gap-5">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-dusk-track">
            <div
              className="animate-breath h-full origin-center bg-sea-dusk"
              style={{ animationDuration: `${durationMs}ms` }}
            />
          </div>
          <p className="text-[16px] tracking-[0.04em] text-dusk-3">{caption}</p>
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-20 text-center text-[15px] text-dusk-faint">
        Recording starts on its own
      </p>
    </Screen>
  );
}
