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
  /**
   * Two features, limited differently on purpose.
   *
   * A session is the thing people want and the expensive thing to
   * give, so it is rationed. A drill costs about a seventh as much and
   * is the daily habit, so it is available every day at both tiers.
   *
   * One drill a day rather than several: the point is returning
   * tomorrow, not doing ten today, and a drill you can repeat endlessly
   * stops being a daily thing.
   */
  free: { sessionsPerWeek: 1, drillsPerDay: 1, answersPerDay: 20 },
  paid: { sessionsPerMonth: 15, drillsPerDay: 1, answersPerDay: 80 },
} as const;

export type Tier = keyof typeof LIMITS;

function startOfWeekUtc(): string {
  const now = new Date();
  const day = now.getUTCDay();
  // Monday as the first day, so a week does not reset mid-weekend.
  const back = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - back),
  );
  return monday.toISOString();
}

function startOfMonthUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

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

  const since = tier === "free" ? startOfWeekUtc() : startOfMonthUtc();

  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  // Fail open on a counting error: blocking a real user because a
  // count query failed is worse than one extra session.
  if (error) {
    console.error("Session limit check failed:", error);
    return { allowed: true };
  }

  const cap =
    tier === "free"
      ? LIMITS.free.sessionsPerWeek
      : LIMITS.paid.sessionsPerMonth;

  if ((count ?? 0) >= cap) {
    return {
      allowed: false,
      message:
        tier === "free"
          ? "That is this week's session. Try today's daily drill instead: one question, one habit, about three minutes. A new session opens on Monday."
          : `That is ${cap} sessions this month. Try today's daily drill instead, and a new month starts soon.`,
    };
  }
  return { allowed: true };
}

export async function checkDrillLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<LimitCheck> {
  if (limitsDisabled()) return { allowed: true };

  const { count, error } = await supabase
    .from("drill_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUtc());

  if (error) {
    console.error("Drill limit check failed:", error);
    return { allowed: true };
  }

  if ((count ?? 0) >= LIMITS.free.drillsPerDay) {
    return {
      allowed: false,
      message:
        "That is today's drill. Come back tomorrow, or start a practice session.",
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
