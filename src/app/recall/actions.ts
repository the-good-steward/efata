"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RecallState = { error?: string; ok?: boolean };

const MIN_BODY = 15;
const MAX_BODY = 600;

export async function logRealQuestion(
  _prev: RecallState,
  formData: FormData,
): Promise<RecallState> {
  const body = String(formData.get("body") ?? "").trim();
  const roleId = String(formData.get("role_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const caughtOut = formData.get("caught_out") === "yes";
  const context = String(formData.get("context") ?? "").trim() || null;

  if (body.length < MIN_BODY) {
    return { error: "Write out the question as closely as you remember it." };
  }
  if (body.length > MAX_BODY) {
    return { error: "That's longer than a question. Just the question itself." };
  }
  if (type !== "hypothetical" && type !== "technical") {
    return { error: "Was it about the work, or about how you'd handle a situation?" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // Falls back to the person's own role when they don't pick one.
  let resolvedRole: string | null = roleId || null;
  if (!resolvedRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_role_id")
      .eq("id", user.id)
      .maybeSingle();
    resolvedRole = (profile?.primary_role_id as string | null) ?? null;
  }

  // status and source are fixed by the RLS insert policy, which only
  // accepts pending community submissions. A user cannot publish
  // straight into the shared bank, which is what keeps the curated
  // question set worth paying for.
  const { error } = await supabase.from("questions").insert({
    role_id: resolvedRole,
    type,
    rubric: type === "technical" ? "technical" : "situational",
    body,
    context,
    // Questions that caught someone out are the valuable ones, so they
    // are marked harder and surface first when curating.
    difficulty: caughtOut ? 4 : 3,
    tier: "free",
    source: "community",
    status: "pending",
    submitted_by: user.id,
  });

  if (error) {
    console.error("Question submission failed:", error);
    return { error: `Couldn't save that: ${error.message}` };
  }

  revalidatePath("/recall");
  return { ok: true };
}
