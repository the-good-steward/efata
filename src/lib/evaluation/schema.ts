import { z } from "zod";

/**
 * A string that is trimmed to a maximum length rather than rejected for
 * exceeding it.
 *
 * Length is a display concern, not a correctness one. Rejecting a whole
 * evaluation because one gap ran twenty characters long throws away
 * feedback the person earned by recording an answer, and asks them to
 * do it again for no reason they can see. Structural problems still
 * fail loudly; verbosity does not.
 */
function capped(max: number) {
  return z.string().transform((value) => {
    const trimmed = value.trim();
    return trimmed.length <= max
      ? trimmed
      : trimmed.slice(0, max - 1).trimEnd() + "\u2026";
  });
}

/**
 * Evaluation output. Scores are 1 to 5.
 *
 * `delivery` is scored for every answer regardless of question type:
 * how someone sounds is independent of what they were asked, and for
 * this audience it is often the thing costing them the work.
 *
 * `substance` uses whichever rubric matches the question. STAR is
 * deliberately not applied to hypotheticals — it scores a story being
 * recalled, so it would penalise a missing Result for a situation that
 * never happened.
 */
export const evaluation = z.object({
  substance: z.object({
    score: z.number().int().min(1).max(5),
    strengths: z.array(capped(400)).max(5).default([]),
    gaps: z.array(capped(400)).max(5).default([]),
  }),
  delivery: z.object({
    score: z.number().int().min(1).max(5),
    filler_words: z.number().int().min(0).max(500).catch(0),
    hedging: z.array(capped(120)).max(8).default([]),
    pace_note: capped(300).default(""),
  }),
  // Spoken directly to the person.
  feedback: z.string().min(20).transform((v) => v.trim()),
  // The single most valuable change for the retry.
  one_thing: capped(400),
  // Their own answer, restructured. Same facts, same story, tightened.
  improved_answer: z.string().min(20).transform((v) => v.trim()),
});

export type Evaluation = z.infer<typeof evaluation>;
