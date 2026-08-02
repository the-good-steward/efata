import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Per-user daily caps.
 *
 * Cost scales with usage, not signups: a thousand people doing one
 * session a month is cheap, while fifty people practising all day is
 * not. Without a ceiling, a single enthusiastic user — or someone
 * hammering the button — lands on the invoice with no warning.
 *
 * The limits are set to be invisible to a person practising seriously.
 * Three sessions is more than anyone can usefully do in a day, and
 * forty answers covers several sessions with retries on every question.
 */
export const LIMITS = {
  free: { sessionsPerDay: 3, answersPerDay: 40 },
  paid: { sessionsPerDay: 12, answersPerDay: 150 },
} as const;

export type Tier = keyof typeof LIMITS;

function startOfDayUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export type LimitCheck = { allowed: boolean; message?: string };

export async function checkSessionLimit(
  supabase: SupabaseClient,
  userId: string,
  tier: Tier,
): Promise<LimitCheck> {
  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUtc());

  // Fail open on a counting error: blocking a paying user because a
  // count query failed is worse than the cost of one extra session.
  if (error) {
    console.error("Session limit check failed:", error);
    return { allowed: true };
  }

  const cap = LIMITS[tier].sessionsPerDay;
  if ((count ?? 0) >= cap) {
    return {
      allowed: false,
      message:
        tier === "free"
          ? `That's ${cap} sets of questions today. Practise the ones you have — answering the same question twice teaches more than a new set does.`
          : `That's ${cap} sets today. Come back tomorrow.`,
    };
  }
  return { allowed: true };
}

export async function checkAnswerLimit(
  supabase: SupabaseClient,
  userId: string,
  tier: Tier,
): Promise<LimitCheck> {
  const { count, error } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUtc());

  if (error) {
    console.error("Answer limit check failed:", error);
    return { allowed: true };
  }

  const cap = LIMITS[tier].answersPerDay;
  if ((count ?? 0) >= cap) {
    return {
      allowed: false,
      message: `That's ${cap} answers today. Rest your voice and come back tomorrow.`,
    };
  }
  return { allowed: true };
}
