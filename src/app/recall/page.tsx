import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecallForm } from "@/components/recall-form";

export const metadata = { title: "What were you asked? · Efata" };

export default async function RecallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: roles }, { data: profile }, { data: mine }] =
    await Promise.all([
      supabase.from("roles").select("id, label").order("label"),
      supabase
        .from("profiles")
        .select("primary_role_id")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("questions")
        .select("id, body, type, created_at")
        .eq("source", "community")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/practice"
          className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
        >
          Back to practice
        </Link>

        <h1 className="text-parchment font-display mt-8 text-4xl">
          What were you actually asked?
        </h1>
        <p className="text-ash font-body mt-4 text-sm leading-relaxed">
          Just had a real interview or client call? Write down what they asked
          while it&rsquo;s fresh. It takes a minute, and it makes the practice
          questions real instead of guessed.
        </p>

        <div className="border-rule mt-10 border-t pt-10">
          <RecallForm
            roles={roles ?? []}
            defaultRoleId={(profile?.primary_role_id as string | null) ?? null}
          />
        </div>

        {mine && mine.length > 0 && (
          <div className="border-rule mt-16 border-t pt-10">
            <h2 className="text-ash font-body text-xs tracking-[0.3em] uppercase">
              You&rsquo;ve logged {mine.length}
            </h2>
            <ul className="mt-6 flex flex-col gap-5">
              {mine.map((question) => (
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
          </div>
        )}
      </div>
    </main>
  );
}
