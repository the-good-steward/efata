// Shared shell for every session screen. No state, no data.
import type { ReactNode } from "react";

type Ground = "paper" | "paper-quiet" | "dusk" | "dusk-deep";

const GROUND: Record<Ground, string> = {
  paper: "bg-paper text-ink",
  "paper-quiet": "bg-paper-quiet text-ink",
  dusk: "bg-dusk text-paper",
  "dusk-deep": "bg-dusk-deep text-paper",
};

/** Full-height screen. Content is centred; the footer is pinned. Never scrolls. */
export function Screen({
  ground = "paper",
  header,
  footer,
  children,
}: {
  ground?: Ground;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`animate-rise flex h-full min-h-0 flex-col overflow-hidden ${GROUND[ground]}`}>
      {header}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 px-8 pb-5 md:mx-auto md:w-[800px] md:px-0">
        {children}
      </div>
      {footer ? <div className="px-6 pb-10 md:mx-auto md:w-[800px] md:px-0 md:pb-14">{footer}</div> : null}
    </div>
  );
}

export function Eyebrow({ children, tone = "sea" }: { children: ReactNode; tone?: "sea" | "quiet" | "sea-dusk" }) {
  const c = tone === "sea" ? "text-sea" : tone === "sea-dusk" ? "text-sea-dusk" : "text-ink-3";
  return <div className={`text-[13px] font-medium uppercase tracking-[0.16em] ${c}`}>{children}</div>;
}

export function Rule({ dusk = false }: { dusk?: boolean }) {
  return <div className={`h-px ${dusk ? "bg-dusk-line" : "bg-hairline"}`} />;
}

/** 44px minimum height on every control below. */
export function Primary({ label, onClick, dusk = false }: { label: string; onClick?: () => void; dusk?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-full px-14 py-[18px] text-[17px] font-semibold ${
        dusk ? "bg-paper text-ink" : "bg-ink text-paper"
      }`}
    >
      {label}
    </button>
  );
}

export function Secondary({ label, onClick, dusk = false }: { label: string; onClick?: () => void; dusk?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-full border px-14 py-[17px] text-[17px] font-medium ${
        dusk ? "border-sea-dusk text-sea-dusk" : "border-edge text-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function Quiet({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full px-6 py-4 text-[16px] font-medium text-ink-3">
      {label}
    </button>
  );
}

/** Hairline progress. Used by both waits and by the recording target. */
export function Track({ pct, dusk = false }: { pct: number; dusk?: boolean }) {
  return (
    <div className={`h-0.5 overflow-hidden rounded-full ${dusk ? "bg-dusk-track" : "bg-track"}`}>
      <div className={`h-full rounded-full ${dusk ? "bg-sea-dusk" : "bg-lamp"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LiveDot({ dusk = false }: { dusk?: boolean }) {
  return <div className={`animate-alive size-[9px] rounded-full ${dusk ? "bg-sea-dusk" : "bg-sea"}`} />;
}

/** Question counter + the session's progress ticks. */
export function SessionBar({ index, total, onClose }: { index: number; total: number; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 md:px-10">
      <button type="button" onClick={onClose} aria-label="Leave the session" className="size-11 text-[20px] text-ink-3">
        ✕
      </button>
      <div className="text-[13px] uppercase tracking-[0.16em] text-ink-3">
        Question {index} of {total}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-[3px] w-6 rounded-full ${i < index ? "bg-lamp" : "bg-edge"}`} />
        ))}
      </div>
    </div>
  );
}
