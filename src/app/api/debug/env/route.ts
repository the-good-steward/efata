import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Temporary diagnostic. Reports which environment variables the running
 * server can actually see, so a missing or misspelled key can be
 * identified directly instead of inferred from a dashboard screenshot.
 *
 * Never returns a value — only presence, length, and the first four
 * characters, which is enough to tell a Supabase JWT from an Anthropic
 * key without exposing either.
 *
 * Delete this route once configuration is settled.
 */
export const dynamic = "force-dynamic";

const EXPECTED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
];

function presenceOnly() {
  return Object.fromEntries(
    EXPECTED.map((name) => [name, Boolean(process.env[name])]),
  );
}

export async function GET() {
  // The auth check itself needs Supabase config. If that config is what
  // is broken, requiring auth first would make this route fail with the
  // very error it exists to diagnose. So a construction failure falls
  // back to presence booleans only: enough to find the problem, not
  // enough to be worth leaking.
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch (error) {
    return NextResponse.json(
      {
        note: "Supabase client could not be constructed — config is broken.",
        reason: error instanceof Error ? error.message : String(error),
        present: presenceOnly(),
      },
      { status: 200 },
    );
  }

  if (!signedIn) {
    return NextResponse.json(
      { note: "Sign in for full detail.", present: presenceOnly() },
      { status: 200 },
    );
  }

  const expected = Object.fromEntries(
    EXPECTED.map((name) => {
      const value = process.env[name];
      return [
        name,
        value
          ? { present: true, length: value.length, starts: value.slice(0, 4) }
          : { present: false },
      ];
    }),
  );

  const allNames = Object.keys(process.env)
    .filter((name) => !name.startsWith("VERCEL_") && !name.startsWith("npm_"))
    .sort();

  return NextResponse.json({ expected, allNames }, { status: 200 });
}
