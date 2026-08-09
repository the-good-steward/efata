"use client";
// Screen 9 of 16. The twenty-second wait IS the playback screen. Never
// auto-advances — they may be mid-playback.
import { Screen, Eyebrow, Primary, Quiet, Track, SessionBar } from "./Chrome";

export default function ListenBack({
  index,
  total,
  attempt,
  takeLength,
  playing,
  playedPct,
  analysisPct,
  ready,
  waitingLine,
  onTogglePlay,
  onRerecord,
  onContinue,
  onLeave,
}: {
  index: number;
  total: number;
  attempt: 1 | 2;
  takeLength: string;
  playing: boolean;
  playedPct: number;
  analysisPct: number;
  ready: boolean;
  /** Changes while it works, so the wait does not look stuck. */
  waitingLine?: string;
  onTogglePlay?: () => void;
  onRerecord?: () => void;
  onContinue?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Screen
      header={<SessionBar index={index} total={total} onClose={onLeave} />}
      footer={
        <div className="flex flex-col gap-3">
          {ready ? <Primary label="What you said" onClick={onContinue} /> : null}
          <Quiet
            label={ready ? "Record it again instead" : "Start over instead"}
            onClick={onRerecord}
          />
        </div>
      }
    >
      <h1 className="text-center font-serif text-[29px] leading-[1.35] text-pretty md:text-[38px]">
        {ready ? "Your feedback is ready." : "We\u2019re checking your answer."}
      </h1>
      {!ready && (
        <p className="text-center text-[16px] leading-relaxed text-ink-2 text-pretty md:text-[17px]">
          Nothing to do. Listen back while you wait, or record it again if you
          would rather start over.
        </p>
      )}

      <div className="flex w-full flex-col gap-5 rounded-2xl bg-card p-6">
        <Eyebrow>{attempt === 2 ? "Second go" : "Your answer"} · {takeLength}</Eyebrow>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-13 items-center justify-center rounded-full border-[1.5px] border-ink text-[17px] text-ink"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-track">
            <div className="h-full bg-sea" style={{ width: `${playedPct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        {ready ? null : <Track pct={analysisPct} />}
        <p className="text-[15px] text-ink-3">
          {ready
            ? "No rush. Finish listening if you want to."
            : (waitingLine ?? "Going through what you said. Twenty seconds or so.")}
        </p>
      </div>
    </Screen>
  );
}
