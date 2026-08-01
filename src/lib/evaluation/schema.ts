import { z } from "zod";

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
    // Rubric-specific dimensions, e.g. "acknowledged the other side",
    // "named a concrete next step".
    strengths: z.array(z.string().max(200)).max(4),
    gaps: z.array(z.string().max(200)).max(4),
  }),
  delivery: z.object({
    score: z.number().int().min(1).max(5),
    filler_words: z.number().int().min(0).max(200),
    hedging: z.array(z.string().max(80)).max(6),
    pace_note: z.string().max(200),
  }),
  // Two or three sentences, spoken directly to the person.
  feedback: z.string().min(40).max(1200),
  // The single most valuable change for the retry.
  one_thing: z.string().min(10).max(300),
  // Their own answer, restructured. Same facts, same story, tightened.
  improved_answer: z.string().min(40).max(2000),
});

export type Evaluation = z.infer<typeof evaluation>;
