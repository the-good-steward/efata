"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FeedbackState = { error?: string; ok?: boolean };

const ISSUES = [
  "wrong_facts",
  "misunderstood",
  "transcript_wrong",
  "too_harsh",
  "too_generic",
  "other",
] as const;

export async function rateFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const attemptId = String(formData.get("attempt_id") ?? "");
  const useful = formData.get("useful") === "yes";
  const rawIssue = String(formData.get("issue") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!attemptId) return { error: "Missing attempt." };

  const issue =
    !useful && ISSUES.includes(rawIssue as (typeof ISSUES)[number])
      ? rawIssue
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired." };

  // Upsert rather than insert: changing your mind about feedback is
  // fine, unlike a calibration score where revising after the reveal
  // would defeat the point.
  const { error } = await supabase.from("attempt_feedback").upsert(
    {
      attempt_id: attemptId,
      user_id: user.id,
      useful,
      issue,
      note,
    },
    { onConflict: "attempt_id,user_id" },
  );

  if (error) {
    console.error("Feedback rating failed:", error);
    return { error: "Couldn't save that. Try again." };
  }

  revalidatePath("/practice");
  return { ok: true };
}
