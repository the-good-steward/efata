"use client";
// Screen 10 of 16. The moment people respond to. Their own sentence, hedges
// marked in clay and tappable, and nothing else on the screen.
import { useState } from "react";
import { Screen, Eyebrow, Primary, SessionBar } from "./Chrome";
import HedgeSheet from "./HedgeSheet";

export interface Token { text: string; hedge?: boolean; note?: string; }

export default function WhatYouSaid({
  index,
  total,
  tokens,
  hedgeCount,
  attempt,
  onContinue,
  onLeave,
}: {
  index: number;
  total: number;
  tokens: Token[];
  hedgeCount: number;
  attempt: 1 | 2;
  onContinue?: () => void;
  onLeave?: () => void;
}) {
  const [open, setOpen] = useState<Token | null>(null);
  /**
   * Counted nouns, written out to five and numeric after that. The
   * fallback pluralises, since "1 softeners" and "2 left, tap it" are
   * the kind of small wrongness that makes careful writing elsewhere
   * look accidental.
   */
  const spelled = ["none", "One", "Two", "Three", "Four", "Five"];
  const noun = hedgeCount === 1 ? "softener" : "softeners";
  const counted = `${spelled[hedgeCount] ?? hedgeCount} ${noun}`;
  const tapThem = hedgeCount === 1 ? "Tap it" : "Tap one";

  return (
    <>
      <Screen
        header={<SessionBar index={index} total={total} onClose={onLeave} />}
        footer={<Primary label={attempt === 2 ? "What moved" : "What it cost you"} onClick={onContinue} />}
      >
        <Eyebrow>What you said</Eyebrow>
        <p className="font-serif text-[25px] leading-[1.5] text-ink text-pretty md:text-[36px]">
          {tokens.map((t, i) =>
            t.hedge ? (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(t)}
                className="border-b-[1.5px] border-clay text-clay"
              >
                {t.text}
              </button>
            ) : (
              <span key={i}>{t.text}</span>
            ),
          )}
        </p>
        <p className="text-[14px] leading-relaxed text-ink-3 md:text-[15px]">
          {attempt === 2
            ? `${counted} left, marked in clay. ${tapThem} to see what it does.`
            : `${counted}, marked in clay. ${tapThem} to see what it does.`}
        </p>
      </Screen>
      {open ? <HedgeSheet word={open.text} note={open.note} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
