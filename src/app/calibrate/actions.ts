"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { evaluateAnswer, type Rubric } from "@/lib/evaluation/evaluate";

export type CalibrateState = { error?: string; ok?: boolean };

export async function saveCalibration(
  _prev: CalibrateState,
  formData: FormData,
): Promise<CalibrateState> {
  const attemptId = String(formData.get("attempt_id") ?? "");
  const substance = Number(formData.get("human_substance"));
  const delivery = Number(formData.get("human_delivery"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!attemptId) return { error: "Missing attempt." };
  if (!Number.isInteger(substance) || substance < 1 || substance > 5) {
    return { error: "Give substance a score from 1 to 5." };
  }
  if (!Number.isInteger(delivery) || delivery < 1 || delivery > 5) {
    return { error: "Give delivery a score from 1 to 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.from("calibrations").insert({
    attempt_id: attemptId,
    user_id: user.id,
    human_substance: substance,
    human_delivery: delivery,
    note,
  });

  if (error) {
    // The unique constraint is deliberate: revising a score after
    // seeing Efata's would defeat the point of the exercise.
    if (error.code === "23505") {
      return { error: "You've already scored this one." };
    }
    console.error("Calibration insert failed:", error);
    return { error: `Couldn't save your score: ${error.message}` };
  }

  revalidatePath("/calibrate");
  return { ok: true };
}

export type StabilityState = {
  error?: string;
  runs?: { substance: number; delivery: number }[];
};

/**
 * Re-scores an existing transcript several times to show how much the
 * score moves run to run. If a 3 can also come back as a 4 or 5, the
 * number does not mean much, and it is better to know that than to
 * trust it.
 */
export async function checkStability(
  _prev: StabilityState,
  formData: FormData,
): Promise<StabilityState> {
  const attemptId = String(formData.get("attempt_id") ?? "");
  if (!attemptId) return { error: "Missing attempt." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired." };

  const { data: attempt } = await supabase
    .from("attempts")
    .select("transcript, session_questions (questions (body, rubric))")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt?.transcript) return { error: "That attempt has no transcript." };

  const nested = attempt.session_questions as unknown as {
    questions: { body: string; rubric: Rubric } | null;
  } | null;
  const question = nested?.questions;
  if (!question) return { error: "Couldn't load the question." };

  try {
    const runs = await Promise.all(
      [1, 2, 3].map(async () => {
        const result = await evaluateAnswer({
          question: question.body,
          rubric: question.rubric,
          transcript: attempt.transcript as string,
          // Duration is not stored per attempt, so pace is approximated
          // here. It affects the delivery score slightly, which is
          // acceptable for a variance check.
          durationSeconds: 75,
          attemptNumber: 1,
        });
        return {
          substance: result.substance.score,
          delivery: result.delivery.score,
        };
      }),
    );
    return { runs };
  } catch (error) {
    console.error("Stability check failed:", error);
    return {
      error: error instanceof Error ? error.message.slice(0, 200) : "Failed.",
    };
  }
}
