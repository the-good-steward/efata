import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobPostForm } from "@/components/job-post-form";
import { AppHeader } from "@/components/app-header";

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
        <AppHeader email={user.email} />

        <div>
          <h1 className="ef-display text-paper">Start a session</h1>
          <p className="ef-body text-paper-soft mt-4">
            Paste a job post. Efata builds the questions you&rsquo;re likely
            to face, including the ones about scope, rates and deadlines that
            most people freeze on.
          </p>

          <div className="mt-8">
            <JobPostForm />
          </div>

          <p className="ef-caption text-faint mt-6">
            Any job post works, whatever the role. Questions are researched
            from what employers actually ask, then written for your level.
            A rehearsal, not a prediction.
          </p>
        </div>

        {sessions && sessions.length > 0 && (
          <div className="border-hairline mt-16 border-t pt-10">
            <h2 className="ef-label text-faint">Recent sessions</h2>
            <ul className="mt-5 flex flex-col gap-2">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/practice/${session.id}`}
                    className="bg-raised hover:bg-edge/40 block rounded-[12px] px-4 py-3.5 transition-colors"
                  >
                    <span className="ef-ui text-paper block truncate">
                      {session.title ?? "Untitled session"}
                    </span>
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
