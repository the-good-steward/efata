import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Remembers that the nudge was dismissed, so it is shown once. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await supabase
    .from("profiles")
    .update({ guide_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
