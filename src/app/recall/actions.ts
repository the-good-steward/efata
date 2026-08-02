"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RecallState = { error?: string; ok?: boolean };

const MIN_BODY = 15;
const MAX_BODY = 600;

/**
 * Starts a log for one real interview or client call.
 *
 * The job post comes first on purpose: questions read very differently
 * depending on what was being hired for, and a question stored without
 * that context is much harder to reuse later. It also means the logged
 * questions become a practice session immediately, rather than
 * disappearing into a list.
 */
export async function startRecallSession(
  _prev: RecallState,
  formData: FormData,
): Promise<RecallState> {
  const jobPost = String(formData.get("job_post") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const roleId = String(formData.get("role_id") ?? "") || null;

  if (!title && !jobPost) {
    return { error: "Add the job post, or at least name the role you applied for." };
  }
  if (jobPost.length > 12000) {
    return { error: "That job post is too long. Paste just the role details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      role_id: roleId,
      job_post: jobPost || null,
      title: title || jobPost.split("\n")[0].slice(0, 100),
    })
    .select("id")
    .single();

  if (error || !session) {
    console.error("Recall session insert failed:", error);
    return { error: `Couldn't start that log: ${error?.message ?? "unknown"}` };
  }

  redirect(`/recall/${session.id}`);
}

export async function logRealQuestion(
  _prev: RecallState,
  formData: FormData,
): Promise<RecallState> {
  const sessionId = String(formData.get("session_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const caughtOut = formData.get("caught_out") === "yes";

  if (!sessionId) return { error: "Missing the interview this belongs to." };
  if (body.length < MIN_BODY) {
    return { error: "Write out the question as closely as you remember it." };
  }
  if (body.length > MAX_BODY) {
    return { error: "That's longer than a question. Just the question itself." };
  }
  if (type !== "hypothetical" && type !== "technical") {
    return { error: "Was it about the work, or about handling a situation?" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // RLS only returns this row if the session belongs to the caller.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, role_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return { error: "That interview log isn't one of yours." };

  // status and source are pinned by the insert policy: a user cannot
  // publish into the shared or paid bank.
  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      role_id: session.role_id,
      type,
      rubric: type === "technical" ? "technical" : "situational",
      body,
      // The ones people fumble are the most useful to everyone else.
      difficulty: caughtOut ? 4 : 3,
      tier: "free",
      source: "community",
      status: "pending",
      submitted_by: user.id,
    })
    .select("id")
    .single();

  if (error || !question) {
    console.error("Question submission failed:", error);
    return { error: `Couldn't save that: ${error?.message ?? "unknown"}` };
  }

  const { count } = await supabase
    .from("session_questions")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { error: linkError } = await supabase.from("session_questions").insert({
    session_id: sessionId,
    question_id: question.id,
    position: (count ?? 0) + 1,
  });

  if (linkError) console.error("Recall link failed:", linkError);

  revalidatePath(`/recall/${sessionId}`);
  return { ok: true };
}
