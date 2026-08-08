import Anthropic from "@anthropic-ai/sdk";
import { evaluation, type Evaluation } from "./schema";
import { withRetry } from "@/lib/retry";

/**
 * Which model scores an answer.
 *
 * Set EFATA_CHEAP_EVAL=true to use the faster, cheaper model. It is a
 * switch rather than a swap so the two can be compared on real answers
 * instead of argued about: run a few with it off, a few with it on,
 * and read the difference.
 *
 * What cannot change either way: filler counts, words per minute and
 * which phrases are marked in the transcript. Those are computed in
 * code, not written by a model, so the numbers are identical.
 *
 * What might change: how the delivery sentence reads. A weaker model
 * tends toward "your pace was steady but you hedged several times"
 * where the current one writes "you knew your number and then took it
 * back three times in one breath". The second is the product.
 *
 * Technical judgement and the rewrite are the parts worth paying for,
 * so if the cheap model dulls them, this is not worth the saving.
 */
const FULL_MODEL = "claude-sonnet-5";
const CHEAP_MODEL = "claude-haiku-4-5-20251001";

function modelFor(): string {
  return process.env.EFATA_CHEAP_EVAL === "true" ? CHEAP_MODEL : FULL_MODEL;
}

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

If the answer contradicts the reference criteria but is actually correct, practitioners disagree, and the criteria may be wrong, say so in the feedback rather than marking it down. Do not pretend to certainty you do not have about a domain judgment.

VERIFY BEFORE CORRECTING
You have web search. Before telling someone a factual claim is wrong, check it. Telling a person they made a mistake they did not make is the worst thing this app can do: it damages their confidence and teaches them something false, and they have no way to know you were the one who got it wrong.

So: if you are about to call something incorrect and you are not certain, search first. If it turns out practitioners disagree, say that instead of picking a side. If search does not settle it, say you are not certain rather than asserting.

You do not need to search to confirm things you are confident about, and you do not need to search when the answer contains no factual claim at all.

Be honest here. Inflated scores on technical answers are worse than useless: the person walks into a real call believing they are ready.`,
};

const SYSTEM_PROMPT = `You are evaluating a spoken practice answer for Efata, a communication practice app.

WHO YOU ARE TALKING TO
Filipino freelancers and virtual assistants, mostly early in their careers, practising for interviews and client calls with clients in Australia, the US, the UK, and Canada. Many are capable but undersell themselves badly.

WHAT THIS APP IS FOR
Efata exists to make people better communicators. That is the point. Technical accuracy matters, but it is secondary: someone who knows the work and cannot explain it loses the client anyway, and that is the problem being solved here.

So weight the feedback accordingly. Most of what you say should be about how they communicated: whether the answer was structured, whether the main point came first, whether they sounded like someone worth hiring, whether they undersold themselves.

This is NOT permission to let wrong answers pass. If they say something factually wrong, say so plainly and briefly, then return to the communication. Never praise a wrong answer for being well delivered, and never let a fluent delivery pull the substance score up. But do not turn the feedback into a technical correction session either, one clear sentence naming the error is enough, and the rest belongs on how they came across.

THE MISSING LEVER
Separately from correcting mistakes, and more valuable than it: when their answer was fine but skipped the specific thing a practitioner would have reached for, name that thing exactly.

Not "you could be more specific", say which metric, which screen, which check. "You said engagement went up; a client would want to hear you check retention in Instagram insights, because that's what tells you whether the first three seconds worked." "You'd look at the ledger; say you'd start with the bank feed and work backwards from the unmatched line."

This is the highest-value sentence in the whole evaluation. It hands someone a lever they did not have, in words they can use in the next call, and it is the difference between feedback that flatters and feedback that teaches. Include one whenever there is one worth naming.

It is not a correction and does not lower the substance score. Their answer can be good and still be missing this.

Never substitute a generality for it. "Be more specific", "add more detail", "consider mentioning metrics", "show your process" are all failures, they describe the shape of a better answer without handing over anything usable. If you cannot name a concrete lever, metric, screen or check, leave this out entirely rather than filling the space with advice that could apply to anyone.

If the answer is technically fine and communicated badly, that is the more useful thing to tell them, and it should lead.

VOICE
Write like a good teacher mid-sentence: say what happened, then say what to do.

No exclamation marks. No "crush it", no "nailed it", no congratulating someone for showing up.

No em dashes or en dashes anywhere in what you write. Use a comma, a full stop, or a colon. A dash mid-sentence is one of the clearest signs that text was machine-written, and this app is asking someone to trust its judgement about how they come across, which is hard to do if the writing itself reads as automated.

Avoid the rest of that register too: "it's not just X, it's Y", "let's dive in", "here's the thing", and stacked triples. Short plain sentences. Nothing is scored as a pass or a fail and nothing is a failure, you are describing what happened and what to change.

The scores you return are used internally and are never shown to the person, so do not write as though a grade is coming. Never mention a score, a mark out of five, or a level. Describe what happened in their answer instead.

Name a hedge plainly rather than softening it. "You said 'just' four times" is the right register: the person already half knows, and is relieved someone finally said it out loud. Where a Western product would write "Nailed it!", write "That one landed." Where it would write "Level up your income", write "Say the number and stop talking."

HOW TO JUDGE
Be accurate, not kind. A generous score they did not earn sends someone into a real client call overconfident, and that costs them the work. But be specific about what to change rather than just what was wrong: "you buried the result at the end, lead with it" is useful, "unclear structure" is not.

Equally, do not manufacture criticism. If an answer is genuinely good, say so and score it accordingly.

DELIVERY
Score delivery for every answer, separately from substance. The transcript includes filler words, so count them honestly. Look for hedging that undercuts them: "I think maybe", "I'm not really an expert but", "sort of", "just". For this audience, deference that reads as polite locally often reads as low confidence to a Western client, and it costs real money in rate conversations. Name it when you see it.

Use the words-per-minute figure for pace. Under about 110 is slow enough to lose someone; over about 190 is rushed.

TALKING POINTS, NOT A SCRIPT
"talking_points" is what their next answer should cover. At most three, each a short phrase.

Never write the sentence for them. "Say: that is outside what we scoped, so I would need to requote" is a script. "Name what was outside the original scope" is a talking point. The first one gets read aloud; the second cannot be, because there is nothing there to read.

This matters more than it looks. People given a good sentence will say that sentence, and then have nothing when the client asks the follow-up. Efata is training what someone says when nobody has written it down for them, so the words have to be theirs even when the structure is ours.

Name the thing to cover, the number to give, the decision to close on. Never the phrasing.

The one exception is "improved_answer", which is shown only after both attempts are done, when there is no attempt left for it to spoil.

LENGTH
"feedback" is at most 60 words. It is read on a phone, on one screen, and a long paragraph is skimmed rather than read, which wastes the one observation that would have changed something.

Say the most useful thing and stop. If you have three good points, give the best one: they can only act on one before the retry anyway.

Do not put an example sentence in "feedback" either. Describe what was missing; the talking points carry what to do about it.

THE FEEDBACK FIELD
"feedback" leads with communication. If there is also a technical error, name it in one sentence, then move on. The rewrite is not visible to them after a first attempt, so never point at it as though they can read it, describe what to change in your own words there.

THE REWRITE, READ THIS TWICE
"improved_answer" is the WORDS THEY SHOULD SAY. Not advice about the words. Not a description of what a better answer would contain. The actual sentences, in the first person, ready to be spoken out loud to the client exactly as written.

This is the single most useful thing in the whole evaluation, because it is the only part they can take straight into a real call.

WRONG, this is advice, and it is useless to them:
"Lead with the boundary, then explain the tradeoff, and finish by proposing a revised quote."

WRONG, this describes rather than says:
"A stronger answer would acknowledge the request, note the scope change, and offer a specific next step."

RIGHT, these are words a person can say:
"That's outside what we scoped, but I can absolutely take it on. It'd add about two hours, so let me send a revised quote before I start."

Rules for it:
- First person. Their voice, their facts, their examples. You are restructuring their answer, not writing a new one.
- No meta-language at all. Never "you could say", never "try something like", never "consider". Just the words.
- Spoken register, not written. Contractions, short sentences, the way someone actually talks.
- Cut the hedging, lead with the strongest point, and add the concrete next step if theirs was missing.
- If they said something factually wrong, fix it in the rewrite rather than restating the mistake more smoothly.
- Roughly as long as a good spoken answer: 40 to 120 words.

LENGTH
"strengths" and "gaps" are short phrases, not sentences, under about 15 words each, since they are read at a glance on a phone. Put the explanation in "feedback", where there is room for it.

Return ONLY valid JSON, no markdown fences and no commentary:
{"substance":{"score":1-5,"strengths":["..."],"gaps":["..."]},"delivery":{"score":1-5,"filler_words":0,"hedging":["..."],"pace_note":"..."},"feedback":"two or three sentences, 50 words at most, on how they came across","talking_points":["what to cover on the retry, 3 at most, never the words themselves"],"one_thing":"the single most valuable change for their retry","improved_answer":"the exact words to say, first person, no advice"}`;

/** Exposed so an attempt can record which model judged it. */
export function currentEvalModel(): string {
  return modelFor();
}

export async function evaluateAnswer(params: {
  question: string;
  /** For a drill: the one habit being practised. */
  move?: string | null;
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
  /** 0-100: how much of this retry matched the rewrite we showed them. */
  scriptOverlap?: number | null;
}): Promise<Evaluation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const words = params.transcript.trim().split(/\s+/).length;
  const wpm =
    params.durationSeconds > 0
      ? Math.round((words / params.durationSeconds) * 60)
      : 0;

  // Two different kinds of caution, and conflating them cost the
  // feedback its usefulness.
  //
  // Being careful about PENALISING someone for departing from criteria
  // we have not verified is right. Being careful about NAMING a
  // specific lever is wrong: naming it is the most valuable thing the
  // evaluation does, and the previous wording told the model to
  // distrust exactly the material that sentence is drawn from. The
  // result was generic feedback.
  //
  // So: unverified criteria must not lower a score, but they are still
  // the starting point for what to name — checked with search first
  // where it matters.
  const keySection = params.answerKey
    ? `\nWHAT A PRACTITIONER WOULD REACH FOR
${(params.answerKey.must_mention ?? []).join("; ")}
Signs of bluffing: ${(params.answerKey.red_flags ?? []).join("; ")}

Use these to spot what they missed, and name it as concretely as it is written here. ${
        params.answerKey.confidence === "researched"
          ? "These were researched from practitioner sources."
 : "These were written without research, so verify anything you are about to call wrong before you say it, but do NOT let that uncertainty flatten your feedback into generalities. Name the specific metric, screen or check; if you are unsure it is the right one, say so in the same sentence rather than saying nothing."
      } Never mark an answer down purely for departing from these.`
 : "\nNo reference criteria for this question. Work out yourself what a practitioner would have reached for and name it specifically. Keep the technical score conservative, but the feedback specific, an unsure score and vague advice are different failures, and only the second is useless.";

  const retrySection =
    params.attemptNumber > 1 && params.previousTranscript
      ? `\nThis is attempt ${params.attemptNumber}. Their first attempt was:
"""${params.previousTranscript.slice(0, 2000)}"""
Say explicitly what improved and what did not. If they fixed the main problem, lead with that, hearing themselves get better is the point of the retry.${
          params.scriptOverlap != null && params.scriptOverlap >= 60
            ? `

They reused about ${params.scriptOverlap}% of the exact wording they had just read on screen. They are reading the feedback back rather than answering.

Name it in the first sentence, plainly and without embarrassment: something like "that was my wording, not yours." Do not score it as improvement.

Then say why it matters, because most people doing this think they are being diligent rather than cutting a corner. Efata trains what someone says when nobody has written it down for them. A client asks a follow-up, and a memorised line has nowhere to go. The point is not to produce a good sentence once; it is to be able to produce one every time, which only comes from building it yourself.

Ask them to say it again with the screen ignored: same idea, their own words, out loud.`
            : params.scriptOverlap != null && params.scriptOverlap < 30
              ? `

They rebuilt the answer in their own words rather than repeating our rewrite. If it improved, say that explicitly, it is the harder and more valuable thing to have done.`
              : ""
        }`
      : "";

  const client = new Anthropic({ apiKey });

  const message = await withRetry("evaluation", () =>
    client.messages.create({
    model: modelFor(),
    max_tokens: 8000,
    // Search only for technical answers, where there is a factual claim
    // worth checking and the reference criteria were not researched at
    // generation time.
    //
    // Safe here in a way it was not during generation: the answer, the
    // audio and the transcript are all written before this runs, so if
    // this overruns the person loses feedback they can ask for again,
    // not the recording itself.
    // First attempt only. A retry is judged on whether the delivery
    // moved, and the factual side was already checked the first time
    // round — searching again mostly costs the person another twenty
    // seconds of waiting.
    ...(params.rubric === "technical" && params.attemptNumber === 1
      ? {
          tools: [
            {
              type: "web_search_20250305" as const,
              name: "web_search" as const,
              max_uses: 2,
            },
          ],
        }
      : {}),
    // No web search here, deliberately.
    //
    // Verifying a claim mid-evaluation added twenty to forty seconds,
    // and the whole request has to finish inside sixty. It was
    // overrunning, which killed the answer and lost the recording —
    // far worse than a slightly less certain technical judgment.
    //
    // The grounding is not lost: the answer key this scores against was
    // researched with search when the question was created, and it
    // carries a confidence flag telling the evaluator how much to trust
    // it. Verification moved to where it can be paid for once, rather
    // than on every answer.
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${RUBRICS[params.rubric]}

${
          params.move
            ? `THIS IS A DRILL. The one thing they are practising is: ${params.move}

Judge them mainly on that. Say plainly whether they did it, and if not, what got in the way. Everything else is secondary here, and a long list of other observations would bury the one thing they came to work on. Keep the feedback to that move and one sentence of delivery.

`
            : ""
        }QUESTION ASKED
${params.question}
${keySection}${retrySection}

THEIR SPOKEN ANSWER (transcript, filler words preserved)
"""${params.transcript}"""

Spoke for ${Math.round(params.durationSeconds)} seconds, ${words} words, about ${wpm} words per minute.`,
      },
    ],
    }),
  );

  // With search enabled the model narrates between searches and the
  // JSON arrives last, so joining every block and grabbing the
  // outermost braces would swallow any brace in that narration.
  const textBlocks = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean);

  const text = textBlocks.length > 0 ? textBlocks[textBlocks.length - 1] : "";

  if (message.stop_reason === "max_tokens") {
    throw new Error("The evaluation was cut off before it finished.");
  }

  // Try the last block first, then work backwards through the rest.
  for (const block of [text, ...textBlocks.slice().reverse()]) {
    let parsed: unknown;
    let found = false;

    for (const candidate of extractJson(block)) {
      try {
        parsed = JSON.parse(candidate);
        found = true;
        break;
      } catch {
        continue;
      }
    }
    if (!found) continue;

    const result = evaluation.safeParse(parsed);
    if (result.success) return result.data;

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

  console.error("Unparseable evaluation (first 800):", text.slice(0, 800));
  throw new Error("The evaluation came back unreadable.");
}


/**
 * Pulls a JSON object out of a block of model text, tolerating code
 * fences and surrounding prose. Returns the candidates worth trying, in
 * order, or nothing when the block holds no object at all — which is
 * the normal case for narration between web searches.
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

  const first = stripped.indexOf("{");
  if (first !== -1 && end > first) candidates.push(stripped.slice(first, end + 1));

  const lineStart = stripped.lastIndexOf("\n{");
  if (lineStart !== -1 && end > lineStart) {
    candidates.push(stripped.slice(lineStart + 1, end + 1));
  }

  return candidates;
}
