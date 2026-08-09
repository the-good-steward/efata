"use client";
// Screen 1 of 16. Paste and screenshots are equal entry points, not a field
// with an upload link under it.
import { useState } from "react";
import { Primary } from "./Chrome";

export interface Screenshot { id: string; name: string; }

export default function Home({
  pastedText,
  screenshots,
  onPaste,
  onAddScreenshot,
  onRemoveScreenshot,
  onBuild,
}: {
  pastedText?: string;
  screenshots: Screenshot[];
  onPaste?: (v: string) => void;
  onAddScreenshot?: () => void;
  onRemoveScreenshot?: (id: string) => void;
  onBuild?: () => void;
}) {
  const [tab, setTab] = useState<"paste" | "shots">("paste");
  const buildLabel =
    tab === "shots" && screenshots.length
      ? `Build from ${screenshots.length} screenshot${screenshots.length === 1 ? "" : "s"}`
      : "Build my questions";

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <div className="flex min-h-0 flex-1 flex-col gap-5 px-6 pt-6 md:mx-auto md:w-[860px] md:px-0 md:pt-14">
        <h1 className="font-serif text-[28px] leading-[1.35] text-pretty md:text-[36px]">
          Show us the job post you&rsquo;re going for.
        </h1>

        <div className="flex gap-1.5 self-stretch rounded-full border border-edge bg-card p-1.5 md:self-start">
          {(["paste", "shots"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-11 flex-1 rounded-full px-7 py-3 text-[15px] md:flex-none ${
                tab === t ? "bg-paper font-semibold text-ink" : "font-medium text-ink-3"
              }`}
            >
              {t === "paste" ? "Paste the text" : "Add screenshots"}
            </button>
          ))}
        </div>

        {tab === "paste" ? (
          <textarea
            value={pastedText}
            onChange={(e) => onPaste?.(e.target.value)}
            placeholder="Paste the whole post. Nothing is sent anywhere until you tap build."
            className="min-h-[26vh] flex-1 resize-none rounded-2xl border border-edge bg-card p-5 text-[16px] leading-[1.7] text-ink placeholder:text-ink-3"
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3.5">
            <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
              {screenshots.length === 0
                ? "Pick one or several at once. Screenshot a long post in parts."
                : "They\u2019re read in this order. Add more if the post carries on."}
            </p>
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap">
              {screenshots.map((s, i) => (
                <div
                  key={s.id}
                  className="relative flex h-26 items-end rounded-2xl border border-edge bg-card p-3 md:h-30 md:w-38"
                >
                  <div className="absolute left-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-paper">
                    {i + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveScreenshot?.(s.id)}
                    aria-label={`Remove screenshot ${i + 1}`}
                    className="absolute right-1 top-1 flex size-11 items-center justify-center text-[16px] text-ink-3"
                  >
                    ✕
                  </button>
                  <div className="text-[13px] text-ink-3">{s.name}</div>
                </div>
              ))}
              <button
                type="button"
                onClick={onAddScreenshot}
                className="flex h-26 flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-edge text-ink-2 md:h-30 md:w-38"
              >
                <span className="text-[22px] leading-none">+</span>
                <span className="text-[14px] font-medium">
                  {screenshots.length === 0 ? "Add a screenshot" : "Add another"}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
          <Primary label={buildLabel} onClick={onBuild} />
          <span className="shrink-0 text-center text-[15px] text-ink-3">
            Takes about forty seconds
          </span>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
