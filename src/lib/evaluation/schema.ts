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
/**
 * Strips dashes the model used despite being told not to.
 *
 * The prompt does the work; this catches the leftovers, because one
 * stray em dash undoes the effort of writing everything else so it
 * does not read as machine-written.
 */
function undash(value: string): string {
  return value
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ");
}

function capped(max: number) {
  return z.string().transform((value) => {
    const trimmed = undash(value.trim());
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
          undash(
            item.length <= itemMax ? item.trim() : item.slice(0, itemMax).trim(),
          ),
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
  /**
   * Trimmed to roughly sixty words if it runs long.
   *
   * The prompt asks for it; this stops an overrun landing on a phone
   * screen it cannot fit, where it used to collide with the header and
   * the action.
   */
  feedback: z
    .string()
    .min(20)
    .transform((v) => {
      const clean = undash(v.trim());
      const words = clean.split(/\s+/);
      if (words.length <= 70) return clean;
      // Cut at the last sentence that fits, rather than mid-thought.
      const truncated = words.slice(0, 70).join(" ");
      const lastStop = truncated.lastIndexOf(".");
      return lastStop > 60 ? truncated.slice(0, lastStop + 1) : truncated + "…";
    }),
  // The single most valuable change for the retry.
  /**
   * What to cover on the retry, as points rather than prose.
   *
   * Feedback written as sentences invites being read aloud, and a
   * quoted example sentence guarantees it. Points name what belongs in
   * the answer without supplying the words, so the sentence still has
   * to be built by the person saying it. That is the whole difference
   * between a script and a rehearsal.
   */
  talking_points: list(3, 120).transform((points) =>
    points.filter((point) => {
      /*
       * Drop anything that is a sentence to recite rather than a thing
       * to cover. The prompt asks for points; this is the backstop,
       * because one scripted line among three teaches the habit the
       * whole design is built to prevent.
       */
      const scripted =
        /^(say|tell them|try saying|you could say)\b/i.test(point.trim()) ||
        /["\u201c\u201d]/.test(point) ||
        point.trim().split(/\s+/).length > 14;
      return !scripted;
    }),
  ),
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
    .transform((v) => undash(v.trim()))
    .refine(
      (v) =>
        !/^(lead with|start by|try |consider |you could|you should|a stronger answer|acknowledge the|instead of saying|begin by)/i.test(
          v,
        ),
      { message: "improved_answer is advice, not the words to say" },
    ),
});

export type Evaluation = z.infer<typeof evaluation>;
