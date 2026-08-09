import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { withRetry } from "@/lib/retry";

/**
 * Turns a real situation into the moment they have to speak.
 *
 * Someone arrives with "my client wants me to take on their inbox and
 * we never agreed that". What they need is not advice, it is the
 * experience of having to say something while a person waits. So this
 * puts the client's line in front of them and stops.
 *
 * It deliberately does not suggest an answer. They propose one out
 * loud, and the coaching happens after.
 */
const MODEL = "claude-sonnet-5";

export const situationQuestion = z.object({
  /** What the client says, in their voice. */
  prompt: z.string().min(15).max(500),
  /** One line on what is actually being tested. */
  why: z.string().min(10).max(240),
  /** A short label for the session list. */
  title: z.string().min(3).max(80),
});

export type SituationQuestion = z.infer<typeof situationQuestion>;

const SYSTEM = `Someone is about to have a difficult conversation with a client and wants to practise it first.

They describe the situation. You put them in the moment: write what the client says, in the client's own voice, and stop there.

Return ONLY JSON, no preamble, no code fences.

WHAT MAKES THIS WORK
Write the client's line, not a question about the situation. "So you can take the inbox on from Monday?" is the moment. "How would you handle a client adding scope?" is a workshop exercise, and they can already answer that one comfortably.

Put it at the hardest point. Not the opening pleasantries, the sentence they have been dreading. If they have to say no, the client has just assumed yes. If they have to raise a rate, the client has just said the current one works well.

Most of these are small, and small is not easy. Asking a question they feel they should already know the answer to, chasing a message without sounding impatient, saying they need a day off. These come up weekly and quietly shape how a client sees someone, so treat them as seriously as a rate conversation. Do not inflate them into a confrontation to make them feel worth practising.

Keep the client reasonable. A rude client is easier, because being treated badly gives you permission. The hard version is a client who is warm, means well, and is quietly assuming something that does not work for them.

Use their details: the actual task, the actual timeline, the actual relationship. Never invent a fact they did not give.

NEVER
Do not suggest what they should say, in any field. Not a phrase, not an approach, not a structure. They will answer it themselves and be coached afterwards, and a hint here would become the thing they recite.

"why" says what is being tested, not how to pass it. "Whether you can hold a line with someone you like" is right. "Remember to acknowledge before pushing back" is not.

SHAPE
{"prompt":"what the client says","why":"what this is testing","title":"four or five words for the list"}`;

export async function buildSituationQuestion(
  situation: string,
): Promise<SituationQuestion> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const message = await withRetry("situation", () =>
    client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `--- THEIR SITUATION ---\n${situation}\n--- END ---`,
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
    throw new Error("Could not build a question from that.");
  }

  return situationQuestion.parse(JSON.parse(text.slice(start, end + 1)));
}
