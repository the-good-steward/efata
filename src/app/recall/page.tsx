import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecallStartForm } from "@/components/recall-start-form";

export const metadata = { title: "What were you asked? · Efata" };

export default async function RecallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("roles").select("id, label").order("label"),
    supabase
      .from("profiles")
      .select("primary_role_id")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/practice"
          className="text-ink-3 font-body hover:text-ink text-sm underline underline-offset-4 transition-colors"
        >
          Back to practice
        </Link>

        <h1 className="text-ink font-display mt-8 text-4xl">
          What were you actually asked?
        </h1>
        <p className="text-ink-3 font-body mt-4 text-sm leading-relaxed">
          Just had a real interview or client call? Start with what you applied
          to, then write down the questions while the wording is fresh.
        </p>

        <div className="border-hairline mt-10 border-t pt-10">
          <RecallStartForm
            roles={roles ?? []}
            defaultRoleId={(profile?.primary_role_id as string | null) ?? null}
          />
        </div>
      </div>
    </main>
  );
}
