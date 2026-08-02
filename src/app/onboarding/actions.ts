"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

const EXPERIENCE = ["beginner", "intermediate", "expert"] as const;
const ENGLISH = ["basic", "conversational", "professional", "fluent"] as const;

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const experience = String(formData.get("experience_level") ?? "");
  const english = String(formData.get("english_level") ?? "");
  const roleId = String(formData.get("primary_role_id") ?? "");

  if (!EXPERIENCE.includes(experience as (typeof EXPERIENCE)[number])) {
    return { error: "Choose how much experience you have." };
  }
  if (!ENGLISH.includes(english as (typeof ENGLISH)[number])) {
    return { error: "Choose how comfortable you are speaking English." };
  }
  if (!roleId) return { error: "Choose the kind of work you do." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      experience_level: experience,
      english_level: english,
      primary_role_id: roleId,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Onboarding update failed:", error);
    return { error: `Couldn't save that: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/practice");
}
