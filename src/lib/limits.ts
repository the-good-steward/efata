import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Per-user daily caps.
 *
 * Cost scales with usage, not signups: a thousand people doing one
 * session a month is cheap, while fifty people practising all day is
 * not. Without a ceiling, a single enthusiastic user — or someone
 * hammering the button — lands on the invoice with no warning.
 *
 * The limits exist to stop one person running up the bill unnoticed,
 * not to ration practice. They should be invisible to anyone using the
 * app as intended — someone comparing three job posts in an evening is
 * a good user, not an abuser, and hitting a wall would teach them the
 * app is stingy.
 *
 * Cached generations are not counted at all: a cache hit costs nothing,
 * so charging it against a quota punishes the case we most want.
 */
export const LIMITS = {
  free: { sessionsPerDay: 8, answersPerDay: 60 },
  paid: { sessionsPerDay: 25, answersPerDay: 200 },
} as const;

export type Tier = keyof typeof LIMITS;

function startOfDayUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export type LimitCheck = { allowed: boolean; message?: string };

/**
 * Kill switch for testing.
 *
 * Set EFATA_UNLIMITED=true to remove every cap. Deliberately an
 * environment variable rather than deleted code: turning limits back on
 * is then one setting, not a revert, and the value is visible in the
 * dashboard rather than buried in a commit.
 *
 * There is no ceiling on spend while this is on. It is safe with a
 * handful of known testers and unsafe the moment the app is open to
 * people you do not know.
 */
function limitsDisabled(): boolean {
  return process.env.EFATA_UNLIMITED === "true";
}

export async function checkSessionLimit(
  supabase: SupabaseClient,
  userId: string,
  tier: Tier,
): Promise<LimitCheck> {
  if (limitsDisabled()) return { allowed: true };

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
 ? `That's ${cap} new sets today. Practise the ones you already have, a second run at the same question does more than a fresh set.`
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
  if (limitsDisabled()) return { allowed: true };

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
