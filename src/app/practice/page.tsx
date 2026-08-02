import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { JobPostForm } from "@/components/job-post-form";
import { Wordmark } from "@/components/logo";

export const metadata = { title: "Practice · Efata" };

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // New accounts go through onboarding first: without a level, question
  // difficulty would default to beginner for everyone.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.onboarded_at) redirect("/onboarding");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        <Wordmark className="mb-10" />

        <header className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
              Signed in
            </p>
            <p className="text-parchment font-body mt-1 text-sm">
              {user.email}
            </p>
          </div>

          <div className="flex items-baseline gap-5">
            <Link
              href="/progress"
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Progress
            </Link>
            <Link
              href="/recall"
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Log a real question
            </Link>
            <Link
              href="/calibrate"
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Calibration
            </Link>
            <form action={logout}>
            <button
              type="submit"
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Sign out
            </button>
            </form>
          </div>
        </header>

        <div className="border-rule mt-12 border-t pt-12">
          <h1 className="text-parchment font-display text-4xl">
            Start a practice session
          </h1>
          <p className="text-ash font-body mt-4 text-sm leading-relaxed">
            Paste a job post and Efata builds the questions you&rsquo;re
            likely to face, including the ones about scope, rates, and
            deadlines that most people freeze on.
          </p>

          <div className="mt-8">
            <JobPostForm />
          </div>

          <p className="text-ash/70 font-body mt-6 text-xs leading-relaxed">
            Any job post works, whatever the role. Questions are researched
            from what employers actually ask, then written for your level.
            They are a rehearsal, not a prediction of the real interview.
          </p>
        </div>

        {sessions && sessions.length > 0 && (
          <div className="border-rule mt-16 border-t pt-12">
            <h2 className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
              Recent sessions
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/practice/${session.id}`}
                    className="text-parchment font-body hover:text-spoken text-sm underline underline-offset-4 transition-colors"
                  >
                    {session.title ?? "Untitled session"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
