import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Sign out from the menu, which is a form rather than an action. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
