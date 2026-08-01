import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the link Supabase emails on signup.
 *
 * Two formats arrive here depending on the email template:
 *
 * 1. `?code=...` — Supabase's DEFAULT template. The link in the email
 *    points at Supabase's own /auth/v1/verify endpoint, which verifies
 *    the token and then redirects here with a PKCE code to exchange.
 *    Editing the default template requires custom SMTP, so this is the
 *    format we get on the free plan.
 *
 * 2. `?token_hash=...&type=...` — used if the template is ever changed
 *    to point here directly. Supported so switching later needs no code
 *    change.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next") ?? "/practice";

  const fail = (reason?: string | null) =>
    NextResponse.redirect(
      reason
        ? `${origin}/auth/error?reason=${encodeURIComponent(reason)}`
        : `${origin}/auth/error`,
    );

  const supabase = await createClient();

  // Format 1: default template.
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? fail(error.message) : NextResponse.redirect(`${origin}${next}`);
  }

  // Format 2: custom template pointing here directly.
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    return error ? fail(error.message) : NextResponse.redirect(`${origin}${next}`);
  }

  // Supabase reports failures by redirecting here with an error param
  // rather than a token.
  return fail(
    searchParams.get("error_description") ?? searchParams.get("error"),
  );
}
