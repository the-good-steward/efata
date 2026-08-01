import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Session · Efata" };

type QuestionRow = {
  id: string;
  type: "experience" | "hypothetical" | "technical";
  body: string;
  context: string | null;
  difficulty: number;
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

  // RLS restricts sessions to the owner, so a session belonging to
  // someone else comes back empty rather than leaking.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: rows } = await supabase
    .from("session_questions")
    .select("position, questions (id, type, body, context, difficulty)")
    .eq("session_id", sessionId)
    .order("position");

  const questions = (rows ?? [])
    .map((row) => row.questions as unknown as QuestionRow | null)
    .filter((q): q is QuestionRow => q !== null);

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
          {questions.length} questions
        </p>

        <ol className="mt-12 flex flex-col gap-10">
          {questions.map((question, index) => (
            <li key={question.id} className="border-rule border-t pt-8">
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
            </li>
          ))}
        </ol>

        <p className="text-ash font-body border-rule mt-16 border-t pt-8 text-sm leading-relaxed">
          Recording and scoring land here next. For now, try answering each
          one out loud, in about 60 to 90 seconds.
        </p>
      </div>
    </main>
  );
}
