"use client";

import { useEffect, useState } from "react";
import { Mark } from "@/components/logo";

/**
 * The waiting state, given the space it deserves.
 *
 * Generation takes up to a minute and evaluation twenty seconds or so.
 * A line of grey caption text for that long reads as nothing happening,
 * which is how a tester ended up reloading and another gave up.
 *
 * The mark breathes rather than spins: a spinner says "busy", a breath
 * says "wait with me", which is closer to what the app is for. Lines
 * change so it is visibly alive, and they describe the work rather than
 * cheering — the brand does not congratulate anyone for waiting.
 */
export function Working({
  lines,
  note,
  intervalMs = 6000,
}: {
  lines: string[];
  note?: string;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % lines.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [lines.length, intervalMs]);

  return (
    <div className="bg-raised flex flex-col items-center rounded-[16px] px-6 py-10 text-center">
      <div className="breathe">
        <Mark size={56} />
      </div>

      <p
        key={index}
        className="ef-body text-paper fade-line mt-7 min-h-[28px] max-w-xs"
      >
        {lines[index]}
      </p>

      {note && <p className="ef-caption text-faint mt-3 max-w-xs">{note}</p>}
    </div>
  );
}
