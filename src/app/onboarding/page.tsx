import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding-form";

export const metadata = { title: "Set up · Efata" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarded_at) redirect("/practice");

  const { data: roleRows } = await supabase
    .from("roles")
    .select("id, label, description, slug")
    .order("label");

  // "Something else" belongs at the bottom, not sorted into the S's.
  const roles = (roleRows ?? []).sort((a, b) =>
    a.slug === "other" ? 1 : b.slug === "other" ? -1 : 0,
  );

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-ink font-display text-4xl">
          Before we start
        </h1>
        <p className="text-ink-3 font-body mt-4 text-sm leading-relaxed">
          Three questions, so the practice fits you rather than a generic
          candidate.
        </p>

        <OnboardingForm roles={roles} />
      </div>
    </main>
  );
}
