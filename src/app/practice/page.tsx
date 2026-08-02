import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { JobPostForm } from "@/components/job-post-form";

export const metadata = { title: "Practice · Efata" };

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-ash font-body text-xs tracking-[0.3em] uppercase">
              Signed in
            </p>
            <p className="text-parchment font-body mt-1 text-sm">
              {user.email}
            </p>
          </div>

          <div className="flex items-baseline gap-5">
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
        </div>

        {sessions && sessions.length > 0 && (
          <div className="border-rule mt-16 border-t pt-12">
            <h2 className="text-ash font-body text-xs tracking-[0.3em] uppercase">
              Recent sessions
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/practice/${session.id}`}
                    className="text-parchment font-body hover:text-gold text-sm underline underline-offset-4 transition-colors"
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
