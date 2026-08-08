import Anthropic from "@anthropic-ai/sdk";
import { generationResult, type GenerationResult } from "./schema";
import { withRetry } from "@/lib/retry";

// Must be a valid Claude API model string. Verify against
// https://platform.claude.com/docs/en/about-claude/models/overview
// before changing — an invalid name fails at request time, not build
// time, so a typo here only surfaces to users in production.
const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You write interview and client-call practice questions for Efata, a communication practice app.

WHO THE USER IS
Filipino freelancers and virtual assistants, mostly early in their careers, applying to remote roles for clients in Australia, the US, the UK, and Canada. Many are capable but underrate themselves, hedge, and undersell their experience. They are not senior specialists. Do not write questions that assume years of experience or a large portfolio.

THE TWO QUESTION TYPES

"hypothetical", situational judgment. Always framed as "what would you do if" or "how would you handle", never "tell me about a time when". Recall questions fail this audience because someone with two clients has no impressive story to tell, so they freeze or invent one. Hypotheticals test judgment instead, and everyone can answer them.

The most valuable hypotheticals are the ones where poor communication costs real money: scope creep, defending a rate, missing a deadline, disagreeing with a client who is confidently wrong, chasing late payment, delivering bad news, saying no without sounding difficult. Include at least two of these in every set, even when the job post does not mention them, because they are what the freelancer will actually face.

"technical", craft knowledge specific to the role. These are the questions a client uses to work out whether someone can actually do the job. They must be hard enough that a person who has only watched a course cannot bluff through them.

Every technical question must do at least one of these:
- Ask HOW they would move a specific number (reach, engagement, response time, days-to-close, page load time) and what levers they would pull first
- Give a concrete broken situation with real symptoms and ask what they check, in what order
- Force a tradeoff between two defensible options and make them justify the choice

Never ask for a definition. Never ask "what is X" or "how familiar are you with X". Name real tools, real metrics, and real numbers wherever the job post gives you any.

The roles you may choose from, and the territory to draw technical questions from for each, are listed in the message below. Pick the single role_slug that best matches the job post.

The catalogue is a hint, not a boundary. Do not force a poor match onto a listed role just because it is there; a bookkeeping question asked of a veterinary receptionist is worse than useless. Whatever role you pick, the technical questions must come from the job post in front of you, its tools, its numbers, its outputs, and the calls that role makes daily.

You may ONLY return a role_slug that appears in the list below. Nothing else is valid.

Set difficulty from the person's experience level, given in the message below. Pitch the technical questions at that level: too hard and they learn nothing, too easy and the practice is worthless.

GROUNDING
Everything comes from the job post in front of you. Use its actual tools, industry, numbers and responsibilities. A question that could have been asked of anyone in any role is a wasted question.

Where you are confident about what this role genuinely gets asked, use it. Where you are not, stay close to the post rather than inventing a plausible-sounding generality.

RULES
- Questions must be answerable out loud in 60 to 120 seconds.
- Plain, direct English. Short sentences. No idioms or corporate jargon, since many users are practicing in a second language.
- No em dashes or en dashes. Use a comma or a full stop. A dash mid-sentence reads as machine-written, and these questions are meant to sound like a person asking them.
- Ground the questions in the specific job post. Use the actual tools, industry, and responsibilities it names.
- Never ask for personal information, salary history, age, marital status, religion, or anything an employer should not ask.
- For technical questions only, include "markers". "must_mention" lists the specific levers, metrics, or checks a strong answer names, concrete things like "checks retention in Instagram insights to see whether the first three seconds held", not vague ones like "shows good understanding". Name the actual screen, metric, or step wherever you can: these are read back to the person as the thing they should have reached for, so a vague marker produces vague feedback and a specific one hands them something they can use in the next call. "red_flags" lists what a bluffer says instead, such as naming a tactic with no way to measure whether it worked.

- The markers are what a person's answer gets scored against, so they must be right. Base them on what you found while searching, not on what sounds plausible. Put the URLs you actually relied on in "sources". Set "confidence" to "unverified", you have no search here, so the markers are your best judgment rather than sourced. They are verified later, when an answer is actually scored against them.

Not having researched them is no reason to make them vague. They are read back to the person as the thing they should have reached for, so "checks retention in Instagram insights to see whether the first three seconds held" is useful and "understands engagement metrics" is not. Name the actual screen, metric or step you believe a practitioner would use. A specific marker that turns out slightly wrong is fixable; a vague one teaches nobody anything. Be sceptical of agency marketing content: these topics attract a lot of search-optimised material that is confident and wrong. Prefer practitioners describing what they actually do.
- difficulty is 1 to 5, where 3 is a competent freelancer with a year of relevant experience.

Return ONLY valid JSON, no markdown fences and no commentary, in exactly this shape:
{"role_slug":"one of admin-va|social-media|customer-support|bookkeeping|web-dev","title":"short label for this practice session","questions":[{"type":"hypothetical","body":"...","context":"optional one-line framing","difficulty":3},{"type":"technical","body":"...","difficulty":4,"markers":{"must_mention":["..."],"red_flags":["..."]}}]}`;

export type EnglishLevel =
  | "basic"
  | "conversational"
  | "professional"
  | "fluent";

export type ExperienceLevel = "beginner" | "intermediate" | "expert";

export type RoleOption = {
  slug: string;
  label: string;
  technical_focus: string | null;
};

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
export type JobPostImage = { mediaType: string; base64: string };

/** What was read from their CV, when they have added one. */
export type CvContext = {
  headline: string;
  roles: { title: string; employer?: string | null; period?: string | null; did: string[] }[];
  tools: string[];
  results: string[];
  yearsExperience: number | null;
};

export async function generateQuestions(
  jobPost: string,
  englishLevel: EnglishLevel,
  experienceLevel: ExperienceLevel = "beginner",
  roles: RoleOption[] = [],
  customRole: string | null = null,
  images: JobPostImage[] = [],
  cv: CvContext | null = null,
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  if (roles.length === 0) throw new Error("No roles are configured.");

  const hasEscapeHatch = roles.some((role) => role.slug === "other");

  const roleCatalogue = roles
    .map(
      (role) =>
        `- ${role.slug} (${role.label})${
          role.technical_focus ? `: ${role.technical_focus}` : ""
        }`,
    )
    .join("\n");

  const client = new Anthropic({ apiKey });

  const message = await withRetry("generation", () =>
    client.messages.create({
    model: MODEL,
    // Grounds the questions in what employers and clients actually ask
    // for this role, instead of the model recalling the genre from
    // training data. This is the difference between plausible-sounding
    // questions and real ones.
    // No web search here, deliberately.
    //
    // Generation blocks the person: if this request runs out of time,
    // they get an error and nothing is saved. Two searches plus a large
    // reasoning budget kept it at the edge of the sixty second limit,
    // which is what produced "this page couldn't load".
    //
    // Research moved to evaluation instead, where a failure is
    // survivable: the answer is saved before it is scored, so a slow
    // search costs feedback rather than the recording.
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          /*
           * Screenshots first, when there are any.
           *
           * Job posts circulate as images in Facebook groups far more
           * than as copyable text, and selecting long text on a phone
           * is awkward. The model reads the post out of the image, so
           * nothing downstream needs to know which way it arrived.
           */
          ...images.map((image) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: image.mediaType as
                | "image/png"
                | "image/jpeg"
                | "image/webp",
              data: image.base64,
            },
          })),
          {
            type: "text" as const,
            text: `${
              cv
                ? `THEIR CV
${cv.headline}${cv.yearsExperience ? ` · about ${cv.yearsExperience} years` : ""}

Roles:
${cv.roles
  .map(
    (r) =>
      `- ${r.title}${r.employer ? ` at ${r.employer}` : ""}${r.period ? ` (${r.period})` : ""}${
        r.did.length ? `: ${r.did.join("; ")}` : ""
      }`,
  )
  .join("\n")}

Tools they list: ${cv.tools.join(", ") || "none listed"}
${cv.results.length ? `Results they claim: ${cv.results.join("; ")}` : ""}

`
                : ""
            }Experience level of the person practising: ${experienceLevel}. ${EXPERIENCE_GUIDANCE[experienceLevel]}

English level: ${englishLevel}. ${LEVEL_GUIDANCE[englishLevel]}

ROLES AND THEIR TECHNICAL TERRITORY
${roleCatalogue}${
          hasEscapeHatch
 ? `\n\nIf nothing above genuinely fits, a pharmacy assistant, a legal transcriptionist, a livestock records clerk, use "other" and build the technical territory from the job post itself. When you do, the technical questions must get MORE specific, not less: name their tools and their situations rather than retreating to generic professionalism.`
            : ""
        }${
          customRole
            ? `\n\nThis person describes their own work as: "${customRole}". Weigh that alongside the job post when choosing the role and writing technical questions.`
            : ""
        }

Write exactly 4 questions for this job post: 2 hypothetical and 2 technical.

THE SHAPE
${
              cv
                ? `They have given us their CV, so two of the four are anchored to what they have actually done:

1. Hypothetical, from the job post. A situation this role would put them in.
2. Hypothetical, from their own history. Something they have genuinely handled, drawn from a role on their CV.
3. Technical, from the job post. What this employer would test.
4. Technical, from their own history. A tool or a task their CV says they have used.

For the two anchored questions, name the real thing: the employer, the role, the tool, the period. "You were at a real estate agency for eight months" is the point of having their CV. "Tell me about a time you handled a difficult client" is not, and is the question this app exists to avoid.

Only anchor to what the CV actually says. Never invent a role, a tool, a client, or a result. If their CV is thin, ask about the tools it does list rather than inventing history.

Do not label which is which. Order them so the anchored ones are not both together, and so it does not read as a pattern.`
                : `They have not added a CV, so all four come from the job post: 2 hypothetical and 2 technical. Do not ask them to recall past experience, because someone early in their career freezes trying to remember a story worth telling.`
            }

Four with two attempts each is eight spoken answers, about twenty minutes. Because there are so few, every one has to earn its place: no warm-ups, nothing that could have been asked of someone in a different job.

One of the hypotheticals should be the money question, the one where poor communication costs them income: scope, rate, a deadline, or saying no.

--- JOB POST ---
${jobPost || "(the post is in the images above)"}
--- END JOB POST ---`,
          },
        ],
      },
    ],
    }),
  );

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
    if (result.success) {
      const known = roles.some((role) => role.slug === result.data.role_slug);
      if (!known) {
        // Deliberately not fatal. The questions themselves are fine; only
        // the tag is unrecognised, usually because the catalogue in the
        // database is behind what the prompt described. Throwing away a
        // good set over a label would be a bad trade.
        console.warn(
          `Model returned unknown role_slug "${result.data.role_slug}". Storing the session untagged.`,
        );
        return { ...result.data, role_slug: "" };
      }
      return result.data;
    }

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
