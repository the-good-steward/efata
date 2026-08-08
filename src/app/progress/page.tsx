import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { buildProgress, type AttemptPoint } from "@/lib/progress";
import { buildPracticeDays } from "@/lib/practice-days";
import { PracticeDaysStrip } from "@/components/practice-days";

export const metadata = { title: "Progress · Efata" };

/**
 * A flat series is the common case early on, and drawing it against a
 * zero range pins the line to the bottom edge where it reads as an
 * empty box. Padding the range keeps a flat line centred, which is the
 * honest picture: nothing has changed yet.
 */
function Sparkline({ series }: { series: number[] }) {
  if (series.length < 3) return null;

  const max = Math.max(...series);
  const min = Math.min(...series);
  const pad = Math.max((max - min) * 0.2, 0.5);
  const top = max + pad;
  const bottom = min - pad;
  const span = top - bottom;

  const w = 100;
  const h = 28;

  const points = series
    .map((value, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((value - bottom) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-4 h-8 w-full"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-seaglass)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-raised flex-1 rounded-[12px] px-4 py-3">
      <p className="font-serif text-paper text-[26px] leading-none tabular-nums">
        {value}
      </p>
      <p className="ef-caption text-ink-3 mt-1.5 leading-tight">{label}</p>
    </div>
  );
}

function Metric({
  title,
  headline,
  reading,
  series,
}: {
  title: string;
  headline: string;
  reading: string;
  series: number[];
}) {
  return (
    <section className="bg-raised mt-4 rounded-[16px] p-5">
      <h2 className="ef-label text-ink-3">{title}</h2>
      <p className="font-serif text-paper mt-2 text-[22px] leading-snug">
        {headline}
      </p>
      <Sparkline series={series} />
      <p className="ef-body text-ink-2 mt-3">{reading}</p>
    </section>
  );
}

function readFillers(recent: number | null): string {
  if (recent == null) return "";
  if (recent < 2)
    return "That is clean. A client hears a finished thought, not someone assembling one.";
  if (recent < 5) return "Normal speech. Nobody would notice this on a call.";
  if (recent < 9)
    return "Noticeable. It reads as thinking out loud, which makes a rate sound negotiable.";
  return "Enough that it is doing the talking. One pause instead of one filler is the whole fix.";
}

function readPace(recent: number | null): string {
  if (recent == null) return "";
  if (recent < 110)
    return "Slow enough that attention drifts. Usually nerves, not thinking.";
  if (recent > 190)
    return "Rushed. On a call this reads as wanting it over with.";
  return "A steady pace. Easy to follow, and it sounds like you mean it.";
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("attempts")
    // transcript is only used for a word count, which the server can do
    // here rather than shipping every transcript to the browser.
    .select("created_at, transcript, scores, session_question_id, attempt_number")
    .order("created_at", { ascending: true })
    // Sixty is more than the charts can meaningfully draw, and a
    // fraction of the payload. Three hundred rows of transcripts is a
    // lot to send to a phone to render two lines.
    .limit(60);

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

  const p = buildProgress(points);
  const practiceDays = buildPracticeDays(points.map((x) => x.createdAt));

  const fillerNow = p.fillersPer100.recent ?? p.fillersPer100.series.at(-1) ?? null;
  const paceNow = p.pace.recent ?? p.pace.series.at(-1) ?? null;

  const fillerHeadline =
    p.fillersPer100.early != null && p.fillersPer100.recent != null
      ? `${p.fillersPer100.early.toFixed(0)} per 100 words at first, ${p.fillersPer100.recent.toFixed(0)} now`
      : fillerNow != null
        ? `${fillerNow.toFixed(0)} per 100 words`
        : "Not enough yet";

  const paceHeadline =
    p.pace.early != null && p.pace.recent != null
      ? `${p.pace.early.toFixed(0)} words a minute at first, ${p.pace.recent.toFixed(0)} now`
      : paceNow != null
        ? `${paceNow.toFixed(0)} words a minute`
        : "Not enough yet";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav email={user.email} />
      <main className="flex flex-1 flex-col px-5 pb-28">
      <div className="mx-auto w-full max-w-md">
        

        <h1 className="ef-display text-paper">What&rsquo;s changed</h1>

        {p.answers === 0 ? (
          <p className="ef-body text-ink-2 mt-4">
            Nothing recorded yet. Answer a few questions out loud and this
            fills in.
          </p>
        ) : (
          <>
            <div className="mt-6">
              <PracticeDaysStrip data={practiceDays} />
            </div>

            <div className="mt-4 flex gap-3">
              <Stat value={String(p.answers)} label="answers" />
              <Stat value={String(p.questionsPractised)} label="questions" />
              {p.retriesTaken > 0 && (
                <Stat
                  value={`${p.retriesImproved}/${p.retriesTaken}`}
                  label="second runs that landed"
                />
              )}
            </div>

            {p.retriesTaken > 0 && (
              <p className="ef-body text-ink-2 mt-4">
                {p.retriesImproved === p.retriesTaken
                  ? "Every second attempt beat the first. The retry is doing its work."
                  : p.retriesImproved === 0
                    ? "No second attempt has beaten the first yet. Read the better version aloud once before recording again."
                    : `${p.retriesImproved} of ${p.retriesTaken} second attempts beat the first. That gap is the habit forming.`}
              </p>
            )}

            <Metric
              title="Filler words"
              headline={fillerHeadline}
              reading={readFillers(fillerNow)}
              series={p.fillersPer100.series}
            />

            <Metric
              title="Pace"
              headline={paceHeadline}
              reading={readPace(paceNow)}
              series={p.pace.series}
            />

            {p.topHedges.length > 0 && (
              <section className="bg-raised mt-4 rounded-[16px] p-5">
                <h2 className="ef-label text-ink-3">
                  What you keep reaching for
                </h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {p.topHedges.map((h) => (
                    <li key={h.phrase} className="flex items-baseline gap-3">
                      <span className="text-clay font-serif text-[19px]">
                        &ldquo;{h.phrase}&rdquo;
                      </span>
                      <span className="ef-caption text-ink-3 tabular-nums">
                        {h.count} times
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="ef-body text-ink-2 mt-4">
                  Catching one of these mid-sentence is the whole skill. You do
                  not need to fix all of them.
                </p>
              </section>
            )}

            <Link
              href="/practice"
              className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Practise again
            </Link>
          </>
        )}
      </div>
    </main>
    </div>
  );
}
