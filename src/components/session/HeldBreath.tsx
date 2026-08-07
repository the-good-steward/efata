// Screen 7 of 16. A moment to gather yourself before you speak.
//
// The design had recording start on its own when the line completed.
// In testing that was unsettling: being caught mid-thought by a
// recording you did not start is the opposite of calm, whatever the
// intent. The line still runs, and the pause is still there, but the
// person decides when the microphone opens.
import { Screen, Primary } from "./Chrome";

export default function HeldBreath({
  question,
  caption = "Take a breath.",
  durationMs = 5000,
  ready,
  onStart,
}: {
  question: string;
  caption?: string;
  durationMs?: number;
  /** True once the line has finished; the action appears then. */
  ready?: boolean;
  onStart?: () => void;
}) {
  return (
    <Screen
      ground="dusk-deep"
      footer={
        ready ? (
          <Primary label="Start recording" dusk onClick={onStart} />
        ) : undefined
      }
    >
      <div className="flex flex-col items-center gap-11">
        <h1 className="font-serif text-[34px] leading-[1.3] text-paper text-pretty md:text-[48px]">
          {question}
        </h1>
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

      {!ready && (
        <p className="absolute inset-x-0 bottom-20 text-center text-[15px] text-dusk-faint">
          Nothing is recording yet
        </p>
      )}
    </Screen>
  );
}
