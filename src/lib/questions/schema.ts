import { z } from "zod";

/**
 * Shape the model must return. Anything that fails this is rejected
 * rather than written to the database, so a bad generation surfaces as
 * an error instead of quietly poisoning the question bank.
 */
export const generatedQuestion = z.object({
  type: z.enum(["hypothetical", "technical"]),
  body: z.string().min(15).max(600),
  context: z.string().max(400).optional(),
  difficulty: z.number().int().min(1).max(5),
  // Only present on technical questions: what a strong answer covers.
  markers: z
    .object({
      must_mention: z.array(z.string()).max(6),
      red_flags: z.array(z.string()).max(4),
    })
    .optional(),
});

export const generationResult = z.object({
  role_slug: z.enum([
    "admin-va",
    "social-media",
    "customer-support",
    "bookkeeping",
    "web-dev",
  ]),
  title: z.string().min(3).max(120),
  questions: z.array(generatedQuestion).min(4).max(10),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestion>;
export type GenerationResult = z.infer<typeof generationResult>;
