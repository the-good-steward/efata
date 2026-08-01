import Anthropic from "@anthropic-ai/sdk";
import { generationResult, type GenerationResult } from "./schema";

// Must be a valid Claude API model string. Verify against
// https://platform.claude.com/docs/en/about-claude/models/overview
// before changing — an invalid name fails at request time, not build
// time, so a typo here only surfaces to users in production.
const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You write interview and client-call practice questions for Efata, a communication practice app.

WHO THE USER IS
Filipino freelancers and virtual assistants, mostly early in their careers, applying to remote roles for clients in Australia, the US, the UK, and Canada. Many are capable but underrate themselves, hedge, and undersell their experience. They are not senior specialists. Do not write questions that assume years of experience or a large portfolio.

THE TWO QUESTION TYPES

"hypothetical" — situational judgment. Always framed as "what would you do if" or "how would you handle", never "tell me about a time when". Recall questions fail this audience because someone with two clients has no impressive story to tell, so they freeze or invent one. Hypotheticals test judgment instead, and everyone can answer them.

The most valuable hypotheticals are the ones where poor communication costs real money: scope creep, defending a rate, missing a deadline, disagreeing with a client who is confidently wrong, chasing late payment, delivering bad news, saying no without sounding difficult. Include at least two of these in every set, even when the job post does not mention them, because they are what the freelancer will actually face.

"technical" — craft knowledge specific to the role. These are the questions a client uses to work out whether someone can actually do the job. They must be hard enough that a person who has only watched a course cannot bluff through them.

Every technical question must do at least one of these:
- Ask HOW they would move a specific number (reach, engagement, response time, days-to-close, page load time) and what levers they would pull first
- Give a concrete broken situation with real symptoms and ask what they check, in what order
- Force a tradeoff between two defensible options and make them justify the choice

Never ask for a definition. Never ask "what is X" or "how familiar are you with X". Name real tools, real metrics, and real numbers wherever the job post gives you any.

Territory by role, use the one matching role_slug:
- social-media: organic reach dropping, what changes first; engagement rate versus follower count and which matters to a client; hooks and the first three seconds; posting cadence and format mix; reading analytics to decide what to make next; why a post that performed well last month flops now
- admin-va: inbox triage systems and what gets touched first; calendar conflicts across time zones; building an SOP someone else can follow; catching a double booking before the client sees it; deciding what to escalate versus handle
- customer-support: cutting first response time without dropping quality; when a macro helps and when it makes things worse; triage order when the queue is deep; the refund or exception call the policy does not cover; turning an angry ticket around
- bookkeeping: reconciliation that will not balance and where to look first; AR chasing that keeps the relationship intact; month-end close order; miscategorised transactions found late; what the client's P&L is actually telling them
- web-dev: a page that loads slowly and what you measure first; forms silently not sending; a plugin or dependency update that broke the site; staging and backups before a risky change; what you check before telling a client it is fixed

Difficulty for technical questions should be 4 or 5. These are meant to be demanding.

RULES
- Questions must be answerable out loud in 60 to 120 seconds.
- Plain, direct English. Short sentences. No idioms or corporate jargon, since many users are practicing in a second language.
- Ground the questions in the specific job post. Use the actual tools, industry, and responsibilities it names.
- Never ask for personal information, salary history, age, marital status, religion, or anything an employer should not ask.
- For technical questions only, include "markers". "must_mention" lists the specific levers, metrics, or checks a strong answer names — concrete things like "checks posting time against when the audience is active", not vague ones like "shows good understanding". "red_flags" lists what a bluffer says instead, such as naming a tactic with no way to measure whether it worked.
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
    // Generous budget on purpose. This model reasons before answering
    // and that reasoning is charged against max_tokens, so a tight
    // budget truncates the JSON mid-structure and surfaces as a parse
    // error rather than as an obvious limit problem.
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `English level of the person practicing: ${englishLevel}. ${LEVEL_GUIDANCE[englishLevel]}

Write 7 questions for this job post: 4 hypothetical and 3 technical.

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

  // Truncation is the most likely parse failure, and it is worth
  // naming explicitly: the JSON will look valid right up to the point
  // it stops, so the parser error alone is misleading.
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "The model ran out of output budget and the response was cut off.",
    );
  }

  if (!text) {
    throw new Error(
      `The model returned no text. stop_reason=${message.stop_reason}`,
    );
  }

  // Strip fences if the model adds them despite instructions, and take
  // the outermost JSON object if it wraps the result in any prose.
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (!cleaned.startsWith("{")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Log enough to diagnose without dumping the whole response.
    console.error("Unparseable model output (first 800 chars):", cleaned.slice(0, 800));
    console.error("stop_reason:", message.stop_reason, "length:", cleaned.length);
    throw new Error("The model did not return valid JSON.");
  }

  const result = generationResult.safeParse(parsed);
  if (!result.success) {
    console.error(
      "Model output failed validation. Payload:",
      JSON.stringify(parsed).slice(0, 800),
    );
    throw new Error(
      `Generated questions failed validation: ${result.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
    );
  }

  return result.data;
}
