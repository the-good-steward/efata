import Anthropic from "@anthropic-ai/sdk";
import { evaluation, type Evaluation } from "./schema";

const MODEL = "claude-sonnet-5";

export type Rubric = "star" | "situational" | "technical";

const RUBRICS: Record<Rubric, string> = {
  situational: `SITUATIONAL JUDGMENT (this question asked what they WOULD do)

Do not apply STAR here. STAR scores a story being recalled; this situation never happened, so there is no Result to be missing and penalising its absence would be wrong.

Score substance on:
- Did they acknowledge the other person's position before pushing back?
- Did they commit to a clear course of action, rather than listing options and trailing off?
- Did they hold the boundary without being combative or apologetic?
- Did they end with a concrete next step, a time, a number, or a specific offer?

The most common failure with this audience is over-accommodation: agreeing to everything, apologising for existing, and leaving with no boundary set. Name it plainly when you see it.`,

  star: `STAR (this question asked about something that actually happened)

Score substance on Situation, Task, Action, and Result. The Result is the part people skip, and it is the part that gets them hired: what actually changed, ideally with a number.

Watch for describing the process instead of the outcome, and for saying "we" so often that their own contribution disappears.`,

  technical: `TECHNICAL ACCURACY (this question tested whether they can do the work)

Score substance on whether the answer would convince someone who does this job for a living.

Strong answers name specific levers, metrics, tools, or an order of checks. Weak answers restate the question in different words, describe a tactic with no way to measure whether it worked, or stay abstract because they do not actually know.

Judge the content, not the polish. A hesitant answer that names the right lever is better than a fluent one that names nothing measurable, and it must score higher. Confidence is scored under delivery; do not let it leak into the substance score.

If the answer contradicts the reference criteria but is actually correct — practitioners disagree, and the criteria may be wrong — say so in the feedback rather than marking it down. Do not pretend to certainty you do not have about a domain judgment.

Be honest here. Inflated scores on technical answers are worse than useless: the person walks into a real call believing they are ready.`,
};

const SYSTEM_PROMPT = `You are evaluating a spoken practice answer for Efata, a communication practice app.

WHO YOU ARE TALKING TO
Filipino freelancers and virtual assistants, mostly early in their careers, practising for interviews and client calls with clients in Australia, the US, the UK, and Canada. Many are capable but undersell themselves badly.

HOW TO JUDGE
Be accurate, not kind. A generous score they did not earn sends someone into a real client call overconfident, and that costs them the work. But be specific about what to change rather than just what was wrong: "you buried the result at the end, lead with it" is useful, "unclear structure" is not.

Equally, do not manufacture criticism. If an answer is genuinely good, say so and score it accordingly.

DELIVERY
Score delivery for every answer, separately from substance. The transcript includes filler words, so count them honestly. Look for hedging that undercuts them: "I think maybe", "I'm not really an expert but", "sort of", "just". For this audience, deference that reads as polite locally often reads as low confidence to a Western client, and it costs real money in rate conversations. Name it when you see it.

Use the words-per-minute figure for pace. Under about 110 is slow enough to lose someone; over about 190 is rushed.

THE REWRITE
"improved_answer" is their own answer restructured, not a new one. Keep their facts, their examples, their voice. Tighten it, lead with the strongest point, cut the hedging, add the concrete next step if it was missing. They will read it aloud, so it must sound like something a person says, not something written.

LENGTH
"strengths" and "gaps" are short phrases, not sentences — under about 15 words each, since they are read at a glance on a phone. Put the explanation in "feedback", where there is room for it.

Return ONLY valid JSON, no markdown fences and no commentary:
{"substance":{"score":1-5,"strengths":["..."],"gaps":["..."]},"delivery":{"score":1-5,"filler_words":0,"hedging":["..."],"pace_note":"..."},"feedback":"two or three sentences spoken directly to them","one_thing":"the single most valuable change for their retry","improved_answer":"their answer, restructured"}`;

export async function evaluateAnswer(params: {
  question: string;
  rubric: Rubric;
  transcript: string;
  durationSeconds: number;
  answerKey?: {
    must_mention?: string[];
    red_flags?: string[];
    confidence?: "researched" | "unverified";
  } | null;
  attemptNumber: number;
  previousTranscript?: string | null;
}): Promise<Evaluation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const words = params.transcript.trim().split(/\s+/).length;
  const wpm =
    params.durationSeconds > 0
      ? Math.round((words / params.durationSeconds) * 60)
      : 0;

  const keySection = params.answerKey
    ? `\nREFERENCE CRITERIA${
        params.answerKey.confidence === "researched"
          ? " (researched from practitioner sources)"
          : " (NOT verified — treat as a rough guide, not ground truth, and do not mark an answer down purely for departing from it)"
      }
What a strong answer covers: ${(params.answerKey.must_mention ?? []).join("; ")}
Signs of bluffing: ${(params.answerKey.red_flags ?? []).join("; ")}`
    : "\nNo reference criteria are available for this question. Judge on the merits and keep the technical score conservative rather than confident.";

  const retrySection =
    params.attemptNumber > 1 && params.previousTranscript
      ? `\nThis is attempt ${params.attemptNumber}. Their first attempt was:
"""${params.previousTranscript.slice(0, 2000)}"""
Say explicitly what improved and what did not. If they fixed the main problem, lead with that — hearing themselves get better is the point of the retry.`
      : "";

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${RUBRICS[params.rubric]}

QUESTION ASKED
${params.question}
${keySection}${retrySection}

THEIR SPOKEN ANSWER (transcript, filler words preserved)
"""${params.transcript}"""

Spoke for ${Math.round(params.durationSeconds)} seconds, ${words} words, about ${wpm} words per minute.`,
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (message.stop_reason === "max_tokens") {
    throw new Error("The evaluation was cut off before it finished.");
  }

  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!cleaned.startsWith("{")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Unparseable evaluation (first 800):", cleaned.slice(0, 800));
    throw new Error("The evaluation came back unreadable.");
  }

  const result = evaluation.safeParse(parsed);
  if (!result.success) {
    console.error(
      "Evaluation failed validation:",
      JSON.stringify(parsed).slice(0, 800),
    );
    throw new Error(
      `Evaluation failed validation: ${result.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
    );
  }

  return result.data;
}
