import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildProgress, type AttemptPoint } from "@/lib/progress";

export const metadata = { title: "Progress · Efata" };

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 3) return null;

  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const width = 260;
  const height = 44;

  const points = series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 w-full max-w-[260px]"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--spoken)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Change({
  early,
  recent,
  unit,
  lowerIsBetter,
}: {
  early: number | null;
  recent: number | null;
  unit: string;
  lowerIsBetter: boolean;
}) {
  if (early == null || recent == null) {
    return (
      <p className="text-ash font-body mt-2 text-[15px]">
        Record a few more answers and the change shows up here.
      </p>
    );
  }

  const delta = recent - early;
  const better = lowerIsBetter ? delta < 0 : delta > 0;
  const flat = Math.abs(delta) < 0.5;

  return (
    <p
      className={`font-body mt-2 text-[15px] ${
        flat ? "text-ash" : better ? "text-spoken" : "text-flag"
      }`}
    >
      {early.toFixed(0)} {unit} at the start, {recent.toFixed(0)} in your last
      five.
    </p>
  );
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("attempts")
    .select("created_at, transcript, scores, session_question_id, attempt_number")
    .order("created_at", { ascending: true })
    .limit(300);

  const points: AttemptPoint[] = (rows ?? []).map((row) => {
    const scores = row.scores as {
      substance?: { score?: number };
      delivery?: { score?: number; filler_words?: number; hedging?: string[] };
      words_per_minute?: number | null;
    } | null;

    const transcript = (row.transcript as string | null) ?? "";

    return {
      createdAt: row.created_at as string,
      fillerWords: scores?.delivery?.filler_words ?? 0,
      wordCount: transcript.trim() ? transcript.trim().split(/\s+/).length : 0,
      wordsPerMinute: scores?.words_per_minute ?? null,
      substance: scores?.substance?.score ?? null,
      delivery: scores?.delivery?.score ?? null,
      sessionQuestionId: row.session_question_id as string,
      attemptNumber: row.attempt_number as number,
      oneThing: null,
      hedging: scores?.delivery?.hedging ?? [],
    };
  });

  const progress = buildProgress(points);

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/practice"
          className="text-ash font-body hover:text-parchment inline text-[15px] underline underline-offset-4 transition-colors"
        >
          Back to practice
        </Link>

        <h1
          className="text-parchment font-display mt-8 text-[40px] leading-[44px]"
          style={{ fontWeight: 600 }}
        >
          What&rsquo;s changed
        </h1>

        {progress.answers === 0 ? (
          <p className="text-ash font-body mt-6">
            Nothing recorded yet. Answer a few questions out loud and this
            fills in.
          </p>
        ) : (
          <>
            <div className="border-rule mt-10 flex flex-wrap gap-10 border-t pt-8">
              <div>
                <p className="text-parchment font-display text-[32px] tabular-nums">
                  {progress.answers}
                </p>
                <p className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
                  Answers
                </p>
              </div>
              <div>
                <p className="text-parchment font-display text-[32px] tabular-nums">
                  {progress.questionsPractised}
                </p>
                <p className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
                  Questions
                </p>
              </div>
              {progress.retriesTaken > 0 && (
                <div>
                  <p className="text-parchment font-display text-[32px] tabular-nums">
                    {progress.retriesImproved}
                    <span className="text-ash text-lg">
                      /{progress.retriesTaken}
                    </span>
                  </p>
                  <p className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
                    Retries that improved
                  </p>
                </div>
              )}
            </div>

            <section className="border-rule mt-12 border-t pt-8">
              <h2 className="text-parchment font-display text-2xl">
                Filler words
              </h2>
              <Change
                early={progress.fillersPer100.early}
                recent={progress.fillersPer100.recent}
                unit="per 100 words"
                lowerIsBetter
              />
              <Sparkline series={progress.fillersPer100.series} />
            </section>

            <section className="border-rule mt-12 border-t pt-8">
              <h2 className="text-parchment font-display text-2xl">Pace</h2>
              <Change
                early={progress.pace.early}
                recent={progress.pace.recent}
                unit="words per minute"
                lowerIsBetter={false}
              />
              <p className="text-ash font-body mt-2 text-[13px]">
                Under 110 loses people. Over 190 sounds rushed.
              </p>
              <Sparkline series={progress.pace.series} />
            </section>

            {progress.topHedges.length > 0 && (
              <section className="border-rule mt-12 border-t pt-8">
                <h2 className="text-parchment font-display text-2xl">
                  What you keep reaching for
                </h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {progress.topHedges.map((hedge) => (
                    <li
                      key={hedge.phrase}
                      className="text-parchment font-body flex justify-between"
                    >
                      <span>&ldquo;{hedge.phrase}&rdquo;</span>
                      <span className="text-ash tabular-nums">
                        {hedge.count} times
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-ash font-body mt-4 text-[15px] leading-relaxed">
                  These are the phrases that make a client hear uncertainty
                  where you meant politeness. Catching one of them mid-sentence
                  is the whole skill.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
