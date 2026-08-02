import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecallForm } from "@/components/recall-form";

export const metadata = { title: "Log the questions · Efata" };

export default async function RecallSessionPage({
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
    .select("id, title, job_post")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: rows } = await supabase
    .from("session_questions")
    .select("id, position, questions (id, body, type)")
    .eq("session_id", sessionId)
    .order("position");

  const logged = (rows ?? [])
    .map((row) => row.questions as unknown as {
      id: string;
      body: string;
      type: string;
    } | null)
    .filter(Boolean) as { id: string; body: string; type: string }[];

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/recall"
          className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
        >
          Log a different interview
        </Link>

        <h1 className="text-parchment font-display mt-8 text-3xl">
          {session.title ?? "That interview"}
        </h1>

        {session.job_post && (
          <details className="mt-4">
            <summary className="text-ash font-body cursor-pointer text-sm underline underline-offset-4">
              The job post
            </summary>
            <p className="text-parchment/80 font-body border-rule mt-3 max-h-64 overflow-y-auto border-l pl-4 text-sm leading-relaxed whitespace-pre-line">
              {session.job_post}
            </p>
          </details>
        )}

        <div className="border-rule mt-10 border-t pt-10">
          <h2 className="text-parchment font-display text-xl">
            Add a question they asked
          </h2>
          <p className="text-ash font-body mt-2 text-sm">
            One at a time. Add as many as you remember.
          </p>
          <div className="mt-6">
            <RecallForm sessionId={sessionId} />
          </div>
        </div>

        {logged.length > 0 && (
          <div className="border-rule mt-16 border-t pt-10">
            <h2 className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
              {logged.length} logged
            </h2>
            <ul className="mt-6 flex flex-col gap-5">
              {logged.map((question) => (
                <li key={question.id}>
                  <p className="text-parchment font-body text-sm leading-relaxed">
                    {question.body}
                  </p>
                  <p className="text-ash font-body mt-1 text-xs">
                    {question.type === "technical"
                      ? "About the work"
                      : "About a situation"}
                  </p>
                </li>
              ))}
            </ul>

            <Link
              href={`/practice/${sessionId}`}
              className="bg-parchment text-ink font-body hover:bg-parchment/85 mt-8 inline-block rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Practise these
            </Link>
            <p className="text-ash font-body mt-3 text-xs">
              Real questions from a real interview. Answer them out loud and
              get feedback, same as any session.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
