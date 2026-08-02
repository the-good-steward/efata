import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PracticeRunner,
  type RunnerQuestion,
} from "@/components/practice-runner";

export const metadata = { title: "Session · Efata" };

type QuestionRow = {
  id: string;
  type: string;
  body: string;
  context: string | null;
};

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
    .select("id, position, questions (id, type, body, context)")
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
    .in(
      "session_question_id",
      links.map((l) => l.id),
    )
    .order("attempt_number");

  const attempts = attemptRows ?? [];

  const { data: ratingRows } = await supabase
    .from("attempt_feedback")
    .select("attempt_id")
    .in(
      "attempt_id",
      attempts.map((a) => a.id as string),
    );

  const rated = new Set((ratingRows ?? []).map((r) => r.attempt_id as string));

  const questions: RunnerQuestion[] = links
    .filter((link) => link.question)
    .map((link) => ({
      linkId: link.id,
      body: link.question!.body,
      context: link.question!.context,
      type: link.question!.type,
      attempts: attempts
        .filter((a) => a.session_question_id === link.id)
        .map((a) => ({
          id: a.id as string,
          attempt_number: a.attempt_number as number,
          transcript: (a.transcript as string | null) ?? null,
          feedback: (a.feedback as string | null) ?? null,
          improved_answer: (a.improved_answer as string | null) ?? null,
          rated: rated.has(a.id as string),
          scores: a.scores as RunnerQuestion["attempts"][number]["scores"],
        })),
    }));

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-baseline justify-between gap-4">
          <Link
            href="/practice"
            className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
          >
            Leave session
          </Link>
          <span className="text-ash/70 font-body max-w-[60%] truncate text-right text-xs">
            {session.title ?? "Practice session"}
          </span>
        </div>

        <div className="mt-10">
          <PracticeRunner questions={questions} />
        </div>
      </div>
    </main>
  );
}
