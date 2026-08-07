"use client";

import { useState } from "react";

/**
 * The person's own words, with softeners marked in clay.
 *
 * This is the point of the feedback screen: not a paragraph describing
 * how they came across, but the sentence they actually said with the
 * hedges visible in it. Seeing "I think" sitting in your own transcript
 * does work that a summary cannot.
 *
 * Marks are tappable — each one says what it costs — because being told
 * a phrase is a hedge means little until you see what a client hears.
 */
const EXPLANATIONS: Record<string, string> = {
  just: "Shrinks whatever comes after it. Cut it and the sentence stands up.",
  "i think": "Turns a fact into an opinion the client can argue with.",
  maybe: "Invites them to negotiate something you hadn't offered.",
  "i guess": "Sounds like you haven't decided. You have.",
  "sort of": "Softens the one part that needed to be firm.",
  "kind of": "Softens the one part that needed to be firm.",
  hopefully: "Hands the outcome to chance instead of to you.",
  "i'm not sure but": "Tells them to discount everything that follows.",
  "if that's okay": "Asks permission for something already agreed.",
  "if that's too much": "Offers a discount before anyone asked for one.",
  "whatever suits you": "Gives away the decision you were hired to make.",
  "i'm flexible": "Reads as no floor, rather than as easy to work with.",
  actually: "Filler here. It rarely adds the emphasis it promises.",
  basically: "Usually precedes the clearest part of the sentence. Cut it.",
  "you know": "Asks them to fill in what you meant. Say it instead.",
  um: "",
  uh: "",
};

function explain(phrase: string): string {
  const key = phrase.trim().toLowerCase().replace(/[.,!?]/g, "");
  return EXPLANATIONS[key] ?? "A softener. The sentence is stronger without it.";
}

export function MarkedTranscript({
  transcript,
  hedges,
}: {
  transcript: string;
  hedges: string[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  const phrases = [...new Set(hedges.map((h) => h.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );

  if (phrases.length === 0) {
    return (
      <p className="ef-body text-paper">
        {transcript}
      </p>
    );
  }

  // Longest first so "sort of" wins over "of" when both are flagged.
  const pattern = new RegExp(
    `(${phrases
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})`,
    "gi",
  );

  const pieces = transcript.split(pattern);

  return (
    <div>
      <p className="ef-body text-paper">
        {pieces.map((piece, index) => {
          const isMark = phrases.some(
            (p) => p.toLowerCase() === piece.trim().toLowerCase(),
          );
          if (!isMark) return <span key={index}>{piece}</span>;

          const active = open === `${index}`;
          return (
            <button
              key={index}
              onClick={() => setOpen(active ? null : `${index}`)}
              className={`inline decoration-clay decoration-2 underline underline-offset-4 transition-colors ${
                active ? "text-clay" : "text-clay/90 hover:text-clay"
              }`}
            >
              {piece}
            </button>
          );
        })}
      </p>

      {open !== null && (
        <p className="ef-caption text-ink-3 border-clay/40 mt-4 border-l-2 pl-4">
          {explain(pieces[Number(open)] ?? "")}
        </p>
      )}

      <p className="ef-caption text-ink-3 mt-5">
        {phrases.length === 1
          ? "One softener, marked in clay. Tap it to see what it does."
          : `${phrases.length} softeners, marked in clay. Tap one to see what it does.`}
      </p>
    </div>
  );
}
