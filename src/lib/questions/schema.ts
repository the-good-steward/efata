import { z } from "zod";

/**
 * Shape the model must return.
 *
 * Two principles here, both learned the hard way:
 *
 * 1. Optional fields must accept null, not just absence. A model that
 *    sends `"context": null` means the same thing as omitting it, and
 *    rejecting a whole set of questions over that distinction throws
 *    away work the user waited a minute for.
 *
 * 2. Length is trimmed, not rejected. A body running slightly long is a
 *    display problem; failing the generation is a real one. Structural
 *    problems — a missing body, a difficulty of 9, four questions when
 *    six were asked for — still fail loudly.
 */

/** Trims to a maximum rather than rejecting for exceeding it. */
function capped(max: number) {
  return z.string().transform((value) => {
    const trimmed = value.trim();
    return trimmed.length <= max
      ? trimmed
      : trimmed.slice(0, max - 1).trimEnd() + "\u2026";
  });
}

/** Optional text that tolerates null, empty string, and absence alike. */
function optionalText(max: number) {
  return z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      return trimmed.length <= max
        ? trimmed
        : trimmed.slice(0, max - 1).trimEnd() + "\u2026";
    });
}

/** An array that tolerates null and absence, defaulting to empty. */
function optionalList(max: number, itemMax: number) {
  return z
    .union([z.array(z.string()), z.null()])
    .optional()
    .transform((value) =>
      (value ?? []).slice(0, max).map((item) =>
        item.length <= itemMax ? item.trim() : item.slice(0, itemMax).trim(),
      ),
    );
}

export const generatedQuestion = z.object({
  type: z.enum(["hypothetical", "technical"]),
  body: capped(600).refine((v) => v.length >= 15, {
    message: "question body is too short to be a real question",
  }),
  context: optionalText(400),
  difficulty: z.coerce.number().int().min(1).max(5).catch(3),
  // Only present on technical questions. `sources` records where the
  // criteria came from, so a wrong answer key can be traced and
  // corrected rather than quietly mis-scoring people forever.
  markers: z
    .union([
      z.object({
        must_mention: optionalList(6, 200),
        red_flags: optionalList(4, 200),
        sources: optionalList(6, 300),
        // Set by the model when research was thin, so evaluation can
        // say so instead of scoring confidently off a guess.
        confidence: z
          .enum(["researched", "unverified"])
          .catch("unverified")
          .default("unverified"),
      }),
      z.null(),
    ])
    .optional()
    .transform((value) => value ?? undefined),
});

export const generationResult = z.object({
  // Validated against the roles actually in the database rather than a
  // hardcoded list, so adding a role is a migration and not a deploy.
  role_slug: z.string().min(2).max(40),
  title: capped(120).refine((v) => v.length >= 3, {
    message: "title is too short",
  }),
  questions: z.array(generatedQuestion).min(3).max(8),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestion>;
export type GenerationResult = z.infer<typeof generationResult>;
