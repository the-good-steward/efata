"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordFailure } from "@/lib/failures";

export type DrillState = { error?: string };

/**
 * Starts today's drill.
 *
 * A drill reuses the whole session machinery: it becomes a session
 * holding a single question, so recording, transcription, evaluation,
 * the retry and the rewrite all work unchanged. The only differences
 * are that it is one question rather than five, and that the move being
 * practised is named before they answer.
 *
 * Nothing is generated, so a drill costs one evaluation rather than a
 * generation as well. That matters if this is meant to be daily.
 */
export async function startDrill(
  _prev: DrillState,
  formData: FormData,
): Promise<DrillState> {
  const drillId = String(formData.get("drill_id") ?? "");
  if (!drillId) return { error: "Missing drill." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: drill } = await supabase
    .from("drills")
    .select("id, move, why, prompt, rubric, difficulty")
    .eq("id", drillId)
    .maybeSingle();

  if (!drill) return { error: "That drill isn't available." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_role_id")
    .eq("id", user.id)
    .maybeSingle();

  const admin = createAdminClient();

  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .insert({
      user_id: user.id,
      role_id: profile?.primary_role_id ?? null,
      title: `Drill · ${drill.move}`,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    await recordFailure({
      userId: user.id,
      stage: "drill_session",
      error: sessionError,
      context: { drillId },
    });
    return { error: "Couldn't start that drill. Try again." };
  }

  const { data: question, error: questionError } = await admin
    .from("questions")
    .insert({
      role_id: profile?.primary_role_id ?? null,
      type: drill.rubric === "technical" ? "technical" : "hypothetical",
      rubric: drill.rubric,
      body: drill.prompt,
      // Shown above the question as the thing to practise.
      context: drill.move,
      difficulty: drill.difficulty,
      tier: "free",
      source: "curated",
      status: "approved",
      submitted_by: user.id,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    await recordFailure({
      userId: user.id,
      stage: "drill_question",
      error: questionError,
      context: { drillId },
    });
    return { error: "Couldn't set up that drill. Try again." };
  }

  await admin
    .from("session_questions")
    .insert({ session_id: session.id, question_id: question.id, position: 1 });

  await admin.from("drill_runs").insert({
    drill_id: drill.id,
    user_id: user.id,
    session_id: session.id,
  });

  redirect(`/practice/${session.id}`);
}
