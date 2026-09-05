import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { DrillCard } from "@/components/drill-card";
import { PracticeDaysStrip } from "@/components/practice-days";
import { buildPracticeDays } from "@/lib/practice-days";

export const metadata = { title: "Today's drill · Efata" };
export const maxDuration = 60;

/** The window the strip draws, as a timestamp the query can use. */
function fourteenDaysAgo(): string {
  return new Date(Date.now() - 14 * 86400000).toISOString();
}

export default async function DrillPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; skip?: string }>;
}) {
  const { kind, skip } = await searchParams;
  const wants: "habit" | "field" = kind === "field" ? "field" : "habit";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: drills },
    { data: runs },
    { data: answered },
  ] = await Promise.all([
      supabase
        .from("profiles")
        .select("roles(slug)")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("drills")
        .select("id, move, why, prompt, rubric, kind, role_slug")
        .limit(60),
      supabase
        .from("drill_runs")
        .select("drill_id, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      // Days counted from answers rather than drills started, so
      // opening a drill and not speaking does not count as practice.
      supabase
        .from("attempts")
        // Only the last fourteen days are drawn, so only those are
        // fetched. Two hundred rows to render fourteen marks is a lot
        // to send to a phone.
        .select("created_at")
        .gte(
          "created_at",
          fourteenDaysAgo(),
        )
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

  const practiceDays = buildPracticeDays(
    (answered ?? []).map((a) => a.created_at as string),
  );

  const roleSlug =
    (profile?.roles as { slug?: string } | null)?.slug ?? null;

  const all = drills ?? [];
  const done = runs ?? [];

  /*
   * Two kinds, chosen rather than mixed.
   *
   * A habit drill teaches one communication move and suits anyone. A
   * field drill tests whether someone can explain something in their
   * own work clearly, which is a different exercise. Mixing them means
   * getting whichever came up; separating them means practising what
   * you meant to.
   */
  const ofKind = all.filter((d) => (d.kind ?? "habit") === wants);

  // Field drills are only useful if they match the work someone does.
  const relevant =
    wants === "field"
      ? ofKind.filter((d) => d.role_slug === roleSlug)
      : ofKind;

  const seen = new Set(done.map((r) => r.drill_id as string));
  const unseen = relevant.filter((d) => !seen.has(d.id));
  const pool = unseen.length > 0 ? unseen : relevant;

  /*
   * The same drill all day, unless they ask for a different one.
   *
   * Sometimes it simply does not land: wrong day, does not apply, too
   * close to yesterday's. Being stuck with it until tomorrow is a poor
   * reason not to practise at all, so skipping steps through the pool
   * rather than refusing.
   */
  const today = new Date().toISOString().slice(0, 10);
  const seed = [...today].reduce((n, c) => n + c.charCodeAt(0), 0);
  const skipped = Math.max(0, Math.min(Number(skip) || 0, 20));
  const drill =
    pool.length > 0 ? pool[(seed + skipped) % pool.length] : null;
  const canSkip = pool.length > 1;

  const todayRuns = done.filter(
    (r) => (r.created_at as string).slice(0, 10) === today,
  ).length;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav email={user.email} />
      <main className="flex flex-1 flex-col px-5 pb-28">
      <div className="mx-auto w-full max-w-md">
        

        <PracticeDaysStrip data={practiceDays} />

        <div className="mt-10 flex gap-2">
          <Link
            href="/drill"
            className={`flex-1 rounded-full border px-4 py-3 text-center text-[15px] ${
              wants === "habit"
                ? "border-sea bg-card text-ink font-semibold"
                : "border-edge text-ink-2"
            }`}
          >
            How you say it
          </Link>
          <Link
            href="/drill?kind=field"
            className={`flex-1 rounded-full border px-4 py-3 text-center text-[15px] ${
              wants === "field"
                ? "border-sea bg-card text-ink font-semibold"
                : "border-edge text-ink-2"
            }`}
          >
            Your field
          </Link>
        </div>

        {!drill ? (
          <p className="ef-body text-ink-2 mt-6">
            {wants === "field"
              ? "No field drills for your line of work yet. The habit drills work for everyone in the meantime."
              : "No drills are available yet."}
          </p>
        ) : (
          <DrillCard
            id={drill.id}
            move={drill.move}
            why={drill.why}
            prompt={drill.prompt}
            doneToday={todayRuns > 0}
            skipHref={
              canSkip
                ? `/drill?${wants === "field" ? "kind=field&" : ""}skip=${skipped + 1}`
                : null
            }
          />
        )}

        <p className="ef-caption text-ink-3 mt-8">
          One question, one habit, about three minutes. A drill costs you
          nothing to repeat, so the point is doing it often rather than doing
          it perfectly.
        </p>

        <Link
          href="/practice"
          className="ef-ui text-seaglass mt-6 inline-block underline underline-offset-4"
        >
          Practise a full job post instead
        </Link>
      </div>
    </main>
    </div>
  );
}
