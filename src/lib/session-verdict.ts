/**
 * An overall read on a finished session.
 *
 * Computed from what was already measured, not from another AI call:
 * instant, free, and consistent. It deliberately does not say "you are
 * ready" — nobody can promise that about a conversation that has not
 * happened yet, and this audience would either believe it or stop
 * trusting the app when it turned out to be wrong.
 *
 * What it does say is what a client would notice, and what to do next.
 */
export type SessionAnswer = {
  attemptCount: number;
  fillerWords: number;
  wordCount: number;
  wordsPerMinute: number | null;
  substanceFirst: number | null;
  substanceLast: number | null;
  hedging: string[];
};

export type Verdict = {
  /** Short line, shown large. */
  headline: string;
  /** Two or three sentences under it. */
  body: string;
  /** What to do next, in order. */
  actions: ("finish_retries" | "practise_again" | "log_real" | "rest")[];
  tone: "steady" | "work" | "thin";
};

export function buildVerdict(
  answers: SessionAnswer[],
  totalQuestions: number,
): Verdict {
  const answered = answers.length;
  const retried = answers.filter((a) => a.attemptCount > 1).length;

  // Not enough of the session done to say anything honest about it.
  if (answered === 0) {
    return {
      headline: "Nothing recorded this time",
      body: "The questions are still here whenever you want them. Answering one out loud is worth more than reading all seven.",
      actions: ["practise_again"],
      tone: "thin",
    };
  }

  if (answered < Math.ceil(totalQuestions / 2)) {
    return {
      headline: `${answered} of ${totalQuestions} answered`,
      body: "Too few to read much into. A client will ask you five or six things in a row, and holding up across all of them is a different skill from answering one well.",
      actions: ["practise_again", "rest"],
      tone: "thin",
    };
  }

  const totalWords = answers.reduce((n, a) => n + a.wordCount, 0);
  const totalFillers = answers.reduce((n, a) => n + a.fillerWords, 0);
  const fillerRate = totalWords > 0 ? (totalFillers / totalWords) * 100 : 0;

  const paces = answers
    .map((a) => a.wordsPerMinute)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const avgPace =
    paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : null;

  const hedgeCount = answers.reduce((n, a) => n + a.hedging.length, 0);

  const improved = answers.filter(
    (a) =>
      a.substanceFirst != null &&
      a.substanceLast != null &&
      a.substanceLast > a.substanceFirst,
  ).length;

  // The things a client would actually notice, worst first.
  const problems: string[] = [];
  if (fillerRate >= 9) problems.push("filler words are doing a lot of the talking");
  else if (fillerRate >= 5) problems.push("filler words are noticeable");
  if (hedgeCount >= answered * 2)
    problems.push("you soften almost everything you say");
  else if (hedgeCount >= answered) problems.push("hedging shows up steadily");
  if (avgPace != null && avgPace > 190) problems.push("you speak quickly under pressure");
  if (avgPace != null && avgPace < 110) problems.push("your pace drops when you are thinking");

  const unfinished = answered - retried;

  if (problems.length === 0) {
    return {
      headline: "That would hold up on a call",
      body: `You answered ${answered} in a row without the wheels coming off — clean of filler, steady pace, and you said what you meant. The thing to keep an eye on is whether it holds when the questions are unfamiliar${
        unfinished > 0 ? ", and you left a few without a second run" : ""
      }.`,
      actions: unfinished > 0
        ? ["finish_retries", "practise_again", "log_real"]
        : ["practise_again", "log_real"],
      tone: "steady",
    };
  }

  const first = problems[0];
  const rest = problems.slice(1);

  return {
    headline: "One thing to fix before a real call",
    body: `Across ${answered} answers, ${first}${
      rest.length > 0 ? `, and ${rest.join(", ")}` : ""
    }. ${
      improved > 0
        ? `You did move on ${improved} of them between attempts, which is the part that transfers.`
        : "A second run at the same question is where that usually shifts."
    } Pick the first one and ignore the rest for now — trying to fix everything at once fixes nothing.`,
    actions: unfinished > 0
      ? ["finish_retries", "practise_again"]
      : ["practise_again", "log_real"],
    tone: "work",
  };
}
