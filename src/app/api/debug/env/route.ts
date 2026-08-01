import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Temporary diagnostic. Reports which environment variables the running
 * server can actually see, so a missing or misspelled key can be
 * identified directly instead of inferred from a dashboard screenshot.
 *
 * Never returns a value — only whether a name is present, its length,
 * and its first four characters, which is enough to tell a Supabase key
 * from an Anthropic one without exposing either.
 *
 * Requires a signed-in user. Delete this route once configuration is
 * settled.
 */
export const dynamic = "force-dynamic";

const EXPECTED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
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

  // Every non-Vercel-internal variable name the server can see. Names
  // only. This is what reveals a misspelling: the intended key will be
  // absent from `expected` but visible here under its actual name.
  const allNames = Object.keys(process.env)
    .filter((name) => !name.startsWith("VERCEL_") && !name.startsWith("npm_"))
    .sort();

  return NextResponse.json({ expected, allNames }, { status: 200 });
}
