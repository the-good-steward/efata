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

Set difficulty from the person's experience level, given in the message below. Pitch the technical questions at that level: too hard and they learn nothing, too easy and the practice is worthless.

RESEARCH
You have web search. Use it before writing technical questions. Look up what is genuinely asked for this role and what practitioners say separates a competent hire from a weak one. Prefer what real hiring managers and freelancers describe over generic career-advice listicles.

Synthesise what you find into your own questions. Never copy a question list verbatim from any page, and never reproduce more than a short phrase from a source. The point of searching is to make the questions realistic and current, not to republish someone else's content.

If search turns up nothing useful for the role, say so by keeping the questions grounded in the job post itself rather than inventing generic ones.

RULES
- Questions must be answerable out loud in 60 to 120 seconds.
- Plain, direct English. Short sentences. No idioms or corporate jargon, since many users are practicing in a second language.
- Ground the questions in the specific job post. Use the actual tools, industry, and responsibilities it names.
- Never ask for personal information, salary history, age, marital status, religion, or anything an employer should not ask.
- For technical questions only, include "markers". "must_mention" lists the specific levers, metrics, or checks a strong answer names — concrete things like "checks posting time against when the audience is active", not vague ones like "shows good understanding". "red_flags" lists what a bluffer says instead, such as naming a tactic with no way to measure whether it worked.

- The markers are what a person's answer gets scored against, so they must be right. Base them on what you found while searching, not on what sounds plausible. Put the URLs you actually relied on in "sources". Set "confidence" to "researched" only when you found substantive material from people who do this work; set it to "unverified" when you are largely inferring, which is far better than guessing confidently. Be sceptical of agency marketing content: these topics attract a lot of search-optimised material that is confident and wrong. Prefer practitioners describing what they actually do.
- difficulty is 1 to 5, where 3 is a competent freelancer with a year of relevant experience.

Return ONLY valid JSON, no markdown fences and no commentary, in exactly this shape:
{"role_slug":"one of admin-va|social-media|customer-support|bookkeeping|web-dev","title":"short label for this practice session","questions":[{"type":"hypothetical","body":"...","context":"optional one-line framing","difficulty":3},{"type":"technical","body":"...","difficulty":4,"markers":{"must_mention":["..."],"red_flags":["..."]}}]}`;

export type EnglishLevel =
  | "basic"
  | "conversational"
  | "professional"
  | "fluent";

export type ExperienceLevel = "beginner" | "intermediate" | "expert";

/**
 * Experience sets how hard the questions are. English sets how they are
 * worded. Keeping them separate matters: someone can be highly skilled
 * and still careful in English, and collapsing the two would hand a
 * capable specialist beginner questions.
 */
const EXPERIENCE_GUIDANCE: Record<ExperienceLevel, string> = {
  beginner:
    "New to this work, under about six months. Technical questions should be difficulty 2 or 3 and cover the fundamentals a client would expect on day one. Do not ask about managing others, setting strategy, or owning a budget. They should finish feeling stretched, not defeated.",
  intermediate:
    "Has done this for real clients and can hold their own. Technical questions should be difficulty 3 or 4, about judgment calls and situations with no clean answer, not definitions.",
  expert:
    "Years of experience, could train someone else. Technical questions should be difficulty 4 or 5: tradeoffs between defensible options, diagnosing a situation from thin information, and decisions they would have to defend to a sceptical client.",
};

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
  experienceLevel: ExperienceLevel = "beginner",
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    // Grounds the questions in what employers and clients actually ask
    // for this role, instead of the model recalling the genre from
    // training data. This is the difference between plausible-sounding
    // questions and real ones.
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    // Generous budget on purpose. This model reasons before answering
    // and that reasoning is charged against max_tokens, so a tight
    // budget truncates the JSON mid-structure and surfaces as a parse
    // error rather than as an obvious limit problem.
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Experience level of the person practising: ${experienceLevel}. ${EXPERIENCE_GUIDANCE[experienceLevel]}

English level: ${englishLevel}. ${LEVEL_GUIDANCE[englishLevel]}

First, search the web for what is actually asked in interviews and client calls for this kind of role. Search two or three times with different angles, for example the role title plus "interview questions", the specific tools named in the job post, and what clients ask when hiring for this remotely. Read what you find before writing anything.

Then write 7 questions for this job post: 4 hypothetical and 3 technical.

--- JOB POST ---
${jobPost}
--- END JOB POST ---`,
      },
    ],
  });

  const textBlocks = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean);

  // With web search enabled the reply is not one clean block: the model
  // narrates between searches and the JSON arrives last. Concatenating
  // everything and grabbing the outermost braces would swallow any
  // brace that appeared in that commentary, so work backwards through
  // the blocks and take the first one that parses.
  const text = textBlocks.length > 0 ? textBlocks[textBlocks.length - 1] : "";

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

  // Try the last block first, then work backwards. The JSON normally
  // arrives last, but a stray brace in the model's narration used to be
  // enough to derail extraction.
  const candidates = [text, ...textBlocks.slice().reverse()];

  for (const block of candidates) {
    let parsed: unknown;
    let found = false;

    for (const cleaned of extractJson(block)) {
      try {
        parsed = JSON.parse(cleaned);
        found = true;
        break;
      } catch {
        continue;
      }
    }

    if (!found) continue;

    const result = generationResult.safeParse(parsed);
    if (result.success) return result.data;

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

  console.error(
    "No parseable JSON in model output. Last block (first 800 chars):",
    text.slice(0, 800),
  );
  console.error("stop_reason:", message.stop_reason, "blocks:", textBlocks.length);
  throw new Error("The model did not return valid JSON.");
}


/**
 * Pulls a JSON object out of a block of model text, tolerating code
 * fences and surrounding prose. Returns an empty string when the block
 * contains no object at all, which is the common case for the model's
 * narration between web searches.
 */
function extractJson(raw: string): string[] {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const end = stripped.lastIndexOf("}");
  if (end === -1) return [];

  const candidates: string[] = [];
  if (stripped.startsWith("{")) candidates.push(stripped);

  // From the first brace: correct when the object follows plain prose.
  const first = stripped.indexOf("{");
  if (first !== -1 && end > first) candidates.push(stripped.slice(first, end + 1));

  // From the last opening brace at the start of a line: correct when the
  // prose itself contained braces, which would otherwise poison the
  // slice above.
  const lineStart = stripped.lastIndexOf("\n{");
  if (lineStart !== -1 && end > lineStart) {
    candidates.push(stripped.slice(lineStart + 1, end + 1));
  }

  return candidates;
}
