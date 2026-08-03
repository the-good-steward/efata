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
/** Optional list tolerating null, absence, and empty alike. */
function list(max: number, itemMax: number) {
  return z
    .union([z.array(z.string()), z.null()])
    .optional()
    .transform((value) =>
      (value ?? [])
        .filter(Boolean)
        .slice(0, max)
        .map((item) =>
          item.length <= itemMax ? item.trim() : item.slice(0, itemMax).trim(),
        ),
    );
}

export const evaluation = z.object({
  substance: z.object({
    score: z.coerce.number().int().min(1).max(5),
    strengths: list(5, 400),
    gaps: list(5, 400),
  }),
  delivery: z.object({
    score: z.coerce.number().int().min(1).max(5),
    filler_words: z.coerce.number().int().min(0).max(500).catch(0),
    hedging: list(8, 120),
    pace_note: z.union([z.string(), z.null()]).optional().transform((v) => (v ?? "").trim().slice(0, 300)),
  }),
  // Spoken directly to the person.
  feedback: z.string().min(20).transform((v) => v.trim()),
  // The single most valuable change for the retry.
  one_thing: capped(400),
  // Their own answer, restructured. Same facts, same story, tightened.
  /**
   * The words to say, not advice about them.
   *
   * This regressed once: an instruction meant for the feedback field
   * was read as applying here, and the rewrite started returning
   * coaching notes instead of speakable sentences. The prompt is the
   * real fix; this catches it if it drifts again, since a rewrite that
   * cannot be read aloud is worse than none.
   */
  improved_answer: z
    .string()
    .min(20)
    .transform((v) => v.trim())
    .refine(
      (v) =>
        !/^(lead with|start by|try |consider |you could|you should|a stronger answer|acknowledge the|instead of saying|begin by)/i.test(
          v,
        ),
      { message: "improved_answer is advice, not the words to say" },
    ),
});

export type Evaluation = z.infer<typeof evaluation>;
