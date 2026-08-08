import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { withRetry } from "@/lib/retry";

/**
 * Reads a CV once, into something small enough to carry.
 *
 * The summary sits in every question prompt and every evaluation, so it
 * has to be compact. Roles, tools, years and results are what the app
 * can use; everything else is weight.
 *
 * Contact details are deliberately not extracted. The app has no use
 * for a phone number, and not holding one is simpler than protecting
 * it.
 */
const MODEL = "claude-sonnet-5";

/**
 * Strips contact details that came through anyway.
 *
 * The prompt says not to extract them, and mostly it will not. But this
 * is somebody's employment history, and a phone number that arrives by
 * accident is still a phone number the app is now storing. Cheap to
 * remove, and there is no case where the app wants one.
 */
function scrub(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "")
    .replace(/(\+?\d[\d\s().-]{7,}\d)/g, "")
    .replace(/\b\d{1,4}\s+[A-Z][a-z]+\s+(Street|St|Road|Rd|Avenue|Ave|Barangay|Brgy)\b[^,]*/g, "")
    // Tidy what removal leaves behind: doubled separators, a trailing
    // bullet, an orphaned comma.
    // Collapse runs of bullets left by a removal. Commas are only
    // treated as separators when they are space-padded, so a figure
    // like 1,200 survives intact.
    .replace(/(\s*[·|]\s*)+/g, " · ")
    .replace(/(\s+,)+\s*/g, " ")
    .replace(/^\s*[·|,]\s*/, "")
    .replace(/\s*[·|,]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const scrubbed = (max: number) => z.string().max(max).transform(scrub);

export const cvSummary = z.object({
  headline: scrubbed(160),
  roles: z
    .array(
      z.object({
        title: scrubbed(120),
        employer: scrubbed(120).nullable().optional(),
        period: z.string().max(60).nullable().optional(),
        did: z.array(scrubbed(200)).max(4).default([]),
      }),
    )
    .max(5)
    .default([]),
  /** Named tools and platforms, which is what technical questions hang on. */
  tools: z.array(z.string().max(60)).max(20).default([]),
  /** Anything with a number attached: growth, volume, savings. */
  results: z.array(scrubbed(200)).max(5).default([]),
  yearsExperience: z.number().min(0).max(50).nullable().default(null),
});

export type CvSummary = z.infer<typeof cvSummary>;

const SYSTEM = `You read a CV and return what a practice app can use.

Return ONLY JSON. No preamble, no code fences.

WHAT TO TAKE
- headline: one line, how they would describe their working self
- roles: most recent first, at most five, with what they actually did
- tools: named software and platforms. These matter most, because technical questions hang on them
- results: anything with a number attached
- yearsExperience: total relevant years, or null if it cannot be told

WHAT TO LEAVE
Never extract a phone number, an email, a home address, a birth date, a photo description, or anything about family or civil status. The app has no use for them. If the CV includes them, ignore them entirely.

RULES
Take only what the CV says. Do not infer seniority, do not upgrade a title, do not turn "assisted with" into "managed". This summary is later used to remind someone of experience they have, and inventing any of it would have the app encourage a false claim in a real interview.

If the document is not a CV, or nothing can be read from it, return the shape with empty arrays and a headline saying so.

SHAPE
{"headline":"...","roles":[{"title":"...","employer":"...","period":"...","did":["..."]}],"tools":["..."],"results":["..."],"yearsExperience":null}`;

export async function extractCv(params: {
  base64: string;
  mediaType: string;
}): Promise<CvSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const isPdf = params.mediaType === "application/pdf";

  const message = await withRetry("cv_extract", () =>
    client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "application/pdf" as const,
                    data: params.base64,
                  },
                }
              : {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: params.mediaType as
                      | "image/png"
                      | "image/jpeg"
                      | "image/webp",
                    data: params.base64,
                  },
                },
            { type: "text" as const, text: "Read this CV." },
          ],
        },
      ],
    }),
  );

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Could not read anything from that file.");
  }

  return cvSummary.parse(JSON.parse(text.slice(start, end + 1)));
}
