import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { DrillCard } from "@/components/drill-card";

export const metadata = { title: "Today's drill · Efata" };
export const maxDuration = 60;

export default async function DrillPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: drills }, { data: runs }] = await Promise.all([
    supabase.from("drills").select("id, move, why, prompt, rubric"),
    supabase
      .from("drill_runs")
      .select("drill_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const all = drills ?? [];
  const done = runs ?? [];

  // Everything else before a repeat, so the same move does not come up
  // twice while others have never been practised.
  const seen = new Set(done.map((r) => r.drill_id as string));
  const unseen = all.filter((d) => !seen.has(d.id));
  const pool = unseen.length > 0 ? unseen : all;

  // Stable for the day: the same drill all day, a new one tomorrow.
  const today = new Date().toISOString().slice(0, 10);
  const seed = [...today].reduce((n, c) => n + c.charCodeAt(0), 0);
  const drill = pool[seed % Math.max(pool.length, 1)];

  const todayRuns = done.filter(
    (r) => (r.created_at as string).slice(0, 10) === today,
  ).length;

  return (
    <main className="flex flex-1 flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <AppHeader email={user.email} />

        <p className="ef-label text-ink-3">Today&rsquo;s drill</p>

        {!drill ? (
          <p className="ef-body text-ink-2 mt-4">
            No drills are available yet.
          </p>
        ) : (
          <DrillCard
            id={drill.id}
            move={drill.move}
            why={drill.why}
            prompt={drill.prompt}
            doneToday={todayRuns > 0}
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
  );
}
