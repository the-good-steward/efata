import { NextResponse } from "next/server";

/**
 * Reports whether the app can see its switches, without revealing any
 * values.
 *
 * Added because a variable was set in the dashboard and the app still
 * behaved as though it were absent, and there was no way to tell which
 * of the two was wrong. Booleans and lengths only: enough to diagnose,
 * nothing worth leaking.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const flag = process.env.EFATA_NEW_SESSION;

  return NextResponse.json({
    newSession: {
      // Whether the variable exists at all in this runtime.
      present: flag !== undefined,
      // Whether it matches exactly. A trailing space or a capital T
      // would show as present but not matching.
      matches: flag === "true",
      length: flag?.length ?? 0,
      // Surfaces an invisible space or quote without printing a secret.
      trimmedMatches: flag?.trim().toLowerCase() === "true",
    },
    otherSwitches: {
      unlimited: process.env.EFATA_UNLIMITED === "true",
      signupsClosed: process.env.EFATA_SIGNUPS_CLOSED === "true",
      cheapEval: process.env.EFATA_CHEAP_EVAL === "true",
    },
    keysPresent: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      deepgram: Boolean(process.env.DEEPGRAM_API_KEY),
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}
