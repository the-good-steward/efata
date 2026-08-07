// Screen 2 of 16. The forty-second wait IS the intro card — the only thing a
// first-timer has to read happens during the wait rather than after it.
import { Screen, Eyebrow, Rule, Primary, Track, LiveDot } from "./Chrome";

export default function Building({
  ready,
  pct,
  questionCount,
  onStart,
  onCancel,
}: {
  ready: boolean;
  pct: number;
  questionCount: number;
  onStart?: () => void;
  onCancel?: () => void;
}) {
  return (
    <Screen
      header={
        <div className="px-6 pt-6 md:px-10">
          <button type="button" onClick={onCancel} aria-label="Cancel" className="size-11 text-[20px] text-ink-3">
            ✕
          </button>
        </div>
      }
      footer={
        ready ? (
          <Primary label="Start" onClick={onStart} />
        ) : (
          <div className="flex flex-col gap-3.5">
            <Track pct={pct} />
            <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
              About forty seconds. Read this while it works — it&rsquo;s all you need to know.
            </p>
          </div>
        )
      }
    >
      <div className="flex items-center gap-3">
        {ready ? <div className="size-[9px] rounded-full bg-sea" /> : <LiveDot />}
        <Eyebrow>{ready ? `${questionCount} questions ready` : "Reading the post"}</Eyebrow>
      </div>
      <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[44px]">
        Don&rsquo;t overthink your answers, and don&rsquo;t over-practise.
      </h1>
      <p className="max-w-[60ch] text-[17px] leading-[1.7] text-ink-2 text-pretty md:text-[19px]">
        The goal is to train how you think when you&rsquo;re put on the spot. {questionCount} questions. You can stop any
        time and come back.
      </p>
      <Rule />
      <p className="text-[16px] leading-[1.7] text-ink-3 md:text-[17px]">
        Nothing here is scored. Nobody else hears these.
      </p>
    </Screen>
  );
}
