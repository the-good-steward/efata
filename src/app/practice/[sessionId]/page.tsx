import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnswerRecorder } from "@/components/answer-recorder";

export const metadata = { title: "Session · Efata" };

type QuestionRow = {
  id: string;
  type: "experience" | "hypothetical" | "technical";
  body: string;
  context: string | null;
  difficulty: number;
};

type AttemptRow = {
  id: string;
  session_question_id: string;
  attempt_number: number;
  transcript: string | null;
  feedback: string | null;
  improved_answer: string | null;
  scores: {
    substance?: { score?: number; strengths?: string[]; gaps?: string[] };
    delivery?: {
      score?: number;
      filler_words?: number;
      hedging?: string[];
      pace_note?: string;
    };
    words_per_minute?: number | null;
  } | null;
};

function Score({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
        {label}
      </span>
      <span className="text-parchment font-display text-2xl tabular-nums">
        {value}
        <span className="text-ash text-sm">/5</span>
      </span>
    </div>
  );
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: rows } = await supabase
    .from("session_questions")
    .select("id, position, questions (id, type, body, context, difficulty)")
    .eq("session_id", sessionId)
    .order("position");

  const links = (rows ?? []).map((row) => ({
    id: row.id as string,
    question: row.questions as unknown as QuestionRow | null,
  }));

  const { data: attemptRows } = await supabase
    .from("attempts")
    .select(
      "id, session_question_id, attempt_number, transcript, feedback, improved_answer, scores",
    )
    .in("session_question_id", links.map((l) => l.id))
    .order("attempt_number");

  const attempts = (attemptRows ?? []) as AttemptRow[];

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/practice"
          className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
        >
          Back to practice
        </Link>

        <h1 className="text-parchment font-display mt-8 text-4xl">
          {session.title ?? "Practice session"}
        </h1>
        <p className="text-ash font-body mt-3 text-sm">
          {links.length} questions. Answer out loud, then read the feedback and
          try the same one again.
        </p>
        <p className="text-ash/70 font-body mt-4 text-xs leading-relaxed">
          Efata is here to sharpen how you communicate. It checks technical
          claims against sources, but it can still be wrong about your field,
          so treat the feedback as a second opinion rather than the last word.
        </p>

        <ol className="mt-12 flex flex-col gap-12">
          {links.map((link, index) => {
            const question = link.question;
            if (!question) return null;

            const mine = attempts
              .filter((a) => a.session_question_id === link.id)
              .sort((a, b) => a.attempt_number - b.attempt_number);
            const latest = mine[mine.length - 1];

            return (
              <li key={link.id} className="border-rule border-t pt-8">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-ash font-body text-xs tracking-[0.3em] uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
                    {question.type === "technical" ? "Technical" : "Situational"}
                  </span>
                </div>

                {question.context && (
                  <p className="text-ash font-body mt-4 text-sm italic">
                    {question.context}
                  </p>
                )}

                <p className="text-parchment font-display mt-4 text-xl leading-relaxed">
                  {question.body}
                </p>

                {mine.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="border-rule/60 mt-8 border-l-2 pl-5"
                  >
                    <p className="text-ash font-body text-xs tracking-[0.2em] uppercase">
                      Attempt {attempt.attempt_number}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-8">
                      <Score label="Substance" value={attempt.scores?.substance?.score} />
                      <Score label="Delivery" value={attempt.scores?.delivery?.score} />
                    </div>

                    {attempt.feedback && (
                      <p className="text-parchment font-body mt-5 text-sm leading-relaxed">
                        {attempt.feedback}
                      </p>
                    )}

                    {attempt.scores?.delivery && (
                      <p className="text-ash font-body mt-4 text-xs leading-relaxed">
                        {attempt.scores.delivery.filler_words ?? 0} filler words
                        {attempt.scores.words_per_minute
                          ? `, ${attempt.scores.words_per_minute} words per minute`
                          : ""}
                        {attempt.scores.delivery.hedging?.length
                          ? `. Hedging: ${attempt.scores.delivery.hedging.join(", ")}`
                          : ""}
                      </p>
                    )}

                    <p className="text-ash/70 font-body mt-4 text-xs leading-relaxed">
                      Efata can get things wrong, including facts about your
                      field. Double-check anything technical before you repeat
                      it to a client.
                    </p>

                    {attempt.improved_answer && (
                      <details className="mt-5">
                        <summary className="text-gold font-body cursor-pointer text-sm underline underline-offset-4">
                          Hear it said better
                        </summary>
                        <p className="text-parchment/90 font-body border-rule mt-3 border-l pl-4 text-sm leading-relaxed italic">
                          {attempt.improved_answer}
                        </p>
                        <p className="text-ash font-body mt-3 text-xs">
                          Your answer, restructured. Read it aloud, then record
                          again.
                        </p>
                      </details>
                    )}
                  </div>
                ))}

                <AnswerRecorder
                  sessionQuestionId={link.id}
                  attemptNumber={mine.length + 1}
                  oneThing={
                    latest?.scores?.substance?.gaps?.[0] ??
                    latest?.scores?.delivery?.pace_note ??
                    null
                  }
                />
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
