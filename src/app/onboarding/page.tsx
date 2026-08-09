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
    // The steps own the whole viewport, like the session screens.
    <div className="h-dvh">
      <OnboardingForm roles={roles} />
    </div>
  );
}
