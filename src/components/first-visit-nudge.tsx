"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * A single line pointing at the guide, once.
 *
 * Not a tour. A tour interrupts someone at the moment they are keenest
 * to try the thing, and is gone by the time they actually want it. This
 * says where the explanation lives and gets out of the way, and the
 * dismissal is remembered so it is never seen twice.
 */
export function FirstVisitNudge() {
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <div className="border-sea/30 bg-sea/5 mx-5 flex items-center gap-3 rounded-[12px] border px-4 py-3">
      <p className="ef-caption text-ink-2 flex-1">
        New here?{" "}
        <Link
          href="/guide"
          className="text-sea font-medium underline underline-offset-4"
        >
          How this works
        </Link>{" "}
        takes a minute to read.
      </p>
      <button
        type="button"
        onClick={() => {
          setGone(true);
          void fetch("/api/seen-guide", { method: "POST" });
        }}
        aria-label="Dismiss"
        className="text-ink-3 flex size-11 shrink-0 items-center justify-center text-[16px]"
      >
        ✕
      </button>
    </div>
  );
}
