import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalibrationCard } from "@/components/calibration-card";

export const metadata = { title: "Calibration · Efata" };

type AttemptRow = {
  id: string;
  transcript: string | null;
  scores: {
    substance?: { score?: number };
    delivery?: { score?: number };
  } | null;
  session_questions: {
    questions: { body: string; rubric: string } | null;
  } | null;
};

export default async function CalibratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attemptRows } = await supabase
    .from("attempts")
    .select(
      "id, transcript, scores, session_questions (questions (body, rubric))",
    )
    .order("created_at", { ascending: false })
    .limit(40);

  const attempts = (attemptRows ?? []) as unknown as AttemptRow[];

  const { data: calRows } = await supabase
    .from("calibrations")
    .select("attempt_id, human_substance, human_delivery, note");

  const mine = new Map(
    (calRows ?? []).map((c) => [
      c.attempt_id as string,
      {
        substance: c.human_substance as number,
        delivery: c.human_delivery as number,
        note: (c.note as string | null) ?? null,
      },
    ]),
  );

  // What users reported about the feedback itself. This scales in a way
  // calibration cannot — one person cannot score every answer — but it
  // measures something different: users can reliably say the feedback
  // was vague or misheard them, and cannot reliably say a technical
  // correction was wrong, since not knowing is why they are here.
  const { data: reportRows } = await supabase
    .from("attempt_feedback")
    .select("useful, issue, note, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = reportRows ?? [];
  const usefulCount = reports.filter((r) => r.useful).length;
  const issueCounts = reports.reduce<Record<string, number>>((acc, r) => {
    if (r.issue) acc[r.issue as string] = (acc[r.issue as string] ?? 0) + 1;
    return acc;
  }, {});

  const ISSUE_LABELS: Record<string, string> = {
    wrong_facts: "Got the work wrong",
    misunderstood: "Missed the point",
    transcript_wrong: "Misheard them",
    too_harsh: "Felt unfair",
    too_generic: "Too vague to use",
    other: "Something else",
  };

  // Agreement is only meaningful across scored pairs.
  const pairs = attempts
    .filter((a) => mine.has(a.id) && a.scores?.substance?.score)
    .map((a) => ({
      substanceDiff:
        (a.scores!.substance!.score as number) - mine.get(a.id)!.substance,
      deliveryDiff:
        (a.scores!.delivery?.score ?? 0) - mine.get(a.id)!.delivery,
    }));

  const exact = pairs.filter((p) => p.substanceDiff === 0).length;
  const within1 = pairs.filter((p) => Math.abs(p.substanceDiff) <= 1).length;
  const meanGap =
    pairs.length > 0
      ? (
          pairs.reduce((sum, p) => sum + p.substanceDiff, 0) / pairs.length
        ).toFixed(2)
      : null;

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/practice"
          className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
        >
          Back to practice
        </Link>

        <h1 className="text-parchment font-display mt-8 text-4xl">
          Calibration
        </h1>
        <p className="text-ash font-body mt-4 max-w-lg text-sm leading-relaxed">
          Score each answer yourself before seeing Efata&rsquo;s score. If the
          two mostly agree, the scoring is worth trusting. If they don&rsquo;t,
          better to find out here than after a cohort has been told they were
          ready.
        </p>

        {pairs.length > 0 && (
          <div className="border-rule mt-10 border-t pt-8">
            <h2 className="text-ash font-body text-xs tracking-[0.3em] uppercase">
              Agreement so far, on substance
            </h2>
            <div className="text-parchment font-body mt-4 flex flex-wrap gap-8 text-sm">
              <span>
                <span className="font-display text-2xl tabular-nums">
                  {exact}
                </span>
                <span className="text-ash">/{pairs.length} exact</span>
              </span>
              <span>
                <span className="font-display text-2xl tabular-nums">
                  {within1}
                </span>
                <span className="text-ash">/{pairs.length} within 1</span>
              </span>
              <span>
                <span className="font-display text-2xl tabular-nums">
                  {meanGap && Number(meanGap) > 0 ? `+${meanGap}` : meanGap}
                </span>
                <span className="text-ash"> mean gap</span>
              </span>
            </div>
            <p className="text-ash font-body mt-4 text-xs leading-relaxed">
              A positive mean gap means Efata scores higher than you do, which
              is the direction that would send someone into a real call
              overconfident. Eight or more pairs before reading much into this.
            </p>
          </div>
        )}

        {reports.length > 0 && (
          <div className="border-rule mt-10 border-t pt-8">
            <h2 className="text-ash font-body text-xs tracking-[0.3em] uppercase">
              What people said about the feedback
            </h2>
            <p className="text-parchment font-body mt-4 text-sm">
              <span className="font-display text-2xl tabular-nums">
                {usefulCount}
              </span>
              <span className="text-ash">
                /{reports.length} found it useful
              </span>
            </p>

            {Object.keys(issueCounts).length > 0 && (
              <ul className="mt-5 flex flex-col gap-2">
                {Object.entries(issueCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([issue, count]) => (
                    <li
                      key={issue}
                      className="text-parchment font-body flex justify-between text-sm"
                    >
                      <span>{ISSUE_LABELS[issue] ?? issue}</span>
                      <span className="text-ash tabular-nums">{count}</span>
                    </li>
                  ))}
              </ul>
            )}

            <p className="text-ash font-body mt-5 text-xs leading-relaxed">
              &ldquo;Misheard them&rdquo; points at transcription, not
              evaluation. &ldquo;Too vague&rdquo; points at the prompt.
              &ldquo;Got the work wrong&rdquo; is the one worth reading the
              notes on, since it is the failure users are least able to catch
              on their own.
            </p>
          </div>
        )}

        {attempts.length === 0 ? (
          <p className="text-ash font-body mt-12 text-sm">
            Nothing to calibrate yet. Record some answers first, ideally a mix
            you already know to be strong and weak.
          </p>
        ) : (
          <ol className="mt-12 flex flex-col gap-10">
            {attempts.map((attempt) => {
              const question = attempt.session_questions?.questions;
              if (!question || !attempt.transcript) return null;
              return (
                <CalibrationCard
                  key={attempt.id}
                  attemptId={attempt.id}
                  question={question.body}
                  rubric={question.rubric}
                  transcript={attempt.transcript}
                  efata={
                    attempt.scores?.substance?.score
                      ? {
                          substance: attempt.scores.substance.score,
                          delivery: attempt.scores.delivery?.score ?? 0,
                        }
                      : null
                  }
                  mine={mine.get(attempt.id) ?? null}
                />
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
