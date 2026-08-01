import Anthropic from "@anthropic-ai/sdk";
import { generationResult, type GenerationResult } from "./schema";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You write interview and client-call practice questions for Efata, a communication practice app.

WHO THE USER IS
Filipino freelancers and virtual assistants, mostly early in their careers, applying to remote roles for clients in Australia, the US, the UK, and Canada. Many are capable but underrate themselves, hedge, and undersell their experience. They are not senior specialists. Do not write questions that assume years of experience or a large portfolio.

THE TWO QUESTION TYPES

"hypothetical" — situational judgment. Always framed as "what would you do if" or "how would you handle", never "tell me about a time when". Recall questions fail this audience because someone with two clients has no impressive story to tell, so they freeze or invent one. Hypotheticals test judgment instead, and everyone can answer them.

The most valuable hypotheticals are the ones where poor communication costs real money: scope creep, defending a rate, missing a deadline, disagreeing with a client who is confidently wrong, chasing late payment, delivering bad news, saying no without sounding difficult. Include at least two of these in every set, even when the job post does not mention them, because they are what the freelancer will actually face.

"technical" — craft knowledge specific to the role. These must genuinely separate someone who has done the work from someone who has watched a course about it. Ask about diagnosis and judgment under real constraints, not definitions. Bad: "What is a reconciliation?" Good: "The bank balance is off by exactly one transaction amount but every line looks matched. Where do you look first?"

RULES
- Questions must be answerable out loud in 60 to 120 seconds.
- Plain, direct English. Short sentences. No idioms or corporate jargon, since many users are practicing in a second language.
- Ground the questions in the specific job post. Use the actual tools, industry, and responsibilities it names.
- Never ask for personal information, salary history, age, marital status, religion, or anything an employer should not ask.
- For technical questions only, include "markers": what a strong answer must mention, and red flags that reveal someone bluffing.
- difficulty is 1 to 5, where 3 is a competent freelancer with a year of relevant experience.

Return ONLY valid JSON, no markdown fences and no commentary, in exactly this shape:
{"role_slug":"one of admin-va|social-media|customer-support|bookkeeping|web-dev","title":"short label for this practice session","questions":[{"type":"hypothetical","body":"...","context":"optional one-line framing","difficulty":3},{"type":"technical","body":"...","difficulty":4,"markers":{"must_mention":["..."],"red_flags":["..."]}}]}`;

export type EnglishLevel =
  | "basic"
  | "conversational"
  | "professional"
  | "fluent";

const LEVEL_GUIDANCE: Record<EnglishLevel, string> = {
  basic:
    "Keep wording very simple and short. One idea per sentence. Avoid multi-part questions.",
  conversational:
    "Use everyday English. Keep sentences short and avoid idioms.",
  professional:
    "Normal professional English is fine. Still avoid idioms and slang.",
  fluent:
    "Full professional English, including nuance and multi-part questions.",
};

/**
 * Turns a pasted job post into a set of practice questions.
 * Throws if the model returns anything that fails validation, so a bad
 * generation never reaches the database.
 */
export async function generateQuestions(
  jobPost: string,
  englishLevel: EnglishLevel,
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `English level of the person practicing: ${englishLevel}. ${LEVEL_GUIDANCE[englishLevel]}

Write 6 questions for this job post: 4 hypothetical and 2 technical.

--- JOB POST ---
${jobPost}
--- END JOB POST ---`,
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  // Strip fences if the model adds them despite instructions.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The model did not return valid JSON.");
  }

  const result = generationResult.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Generated questions failed validation: ${result.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
    );
  }

  return result.data;
}
