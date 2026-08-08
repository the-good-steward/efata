import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { cvSummary } from "@/lib/cv/extract";

export const metadata = { title: "My profile · Efata" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: cvRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("english_level, experience_level, custom_role, roles(label)")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("cv_profiles")
      .select("summary, confirmed_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const parsed = cvRow?.summary ? cvSummary.safeParse(cvRow.summary) : null;
  const cv = parsed?.success ? parsed.data : null;

  const role =
    (profile?.roles as { label?: string } | null)?.label ??
    profile?.custom_role ??
    "Not set";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav email={user.email} />

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28">
        <h1 className="ef-display text-ink mt-4">My profile</h1>

        <section className="bg-card mt-8 rounded-[16px] p-5">
          <p className="ef-label text-ink-3">Your CV</p>

          {cv ? (
            <>
              <p className="font-serif text-ink mt-3 text-[20px] leading-snug">
                {cv.headline}
              </p>

              {cv.roles.length > 0 && (
                <p className="ef-body text-ink-2 mt-2">
                  {cv.roles[0].title}
                  {cv.roles[0].employer ? ` at ${cv.roles[0].employer}` : ""}
                  {cv.roles[0].period ? ` · ${cv.roles[0].period}` : ""}
                </p>
              )}

              {cv.tools.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {cv.tools.map((tool) => (
                    <span
                      key={tool}
                      className="border-edge text-ink rounded-full border px-3 py-2 text-[14px]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}

              <p className="ef-caption text-ink-3 mt-4">
                {cvRow?.confirmed_at
                  ? "Checked, and used to shape your questions."
                  : "Not checked yet, so it is not being used."}
              </p>

              <Link
                href="/cv"
                className="border-edge text-ink mt-5 inline-block rounded-full border px-5 py-3 text-[16px] font-medium"
              >
                {cvRow?.confirmed_at ? "Replace it" : "Check it now"}
              </Link>
            </>
          ) : (
            <>
              <p className="ef-body text-ink-2 mt-3">
                No CV yet. With one, Efata can ask about the work you have
                actually done, and point back at experience when you leave it
                out of an answer.
              </p>
              <Link
                href="/cv"
                className="bg-ink text-paper mt-5 inline-block rounded-full px-5 py-3 text-[16px] font-semibold"
              >
                Add my CV
              </Link>
            </>
          )}
        </section>

        <section className="border-hairline mt-8 border-t pt-6">
          <p className="ef-label text-ink-3">How Efata pitches your questions</p>
          <dl className="mt-4 flex flex-col gap-3">
            {[
              ["Work you are going for", role],
              ["Experience", profile?.experience_level ?? "Not set"],
              ["English at work", profile?.english_level ?? "Not set"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="ef-body text-ink-3">{label}</dt>
                <dd className="ef-body text-ink text-right capitalize">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/onboarding"
            className="text-sea mt-5 inline-block text-[16px] underline underline-offset-4"
          >
            Change these
          </Link>
        </section>
      </main>
    </div>
  );
}
