import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and redirects
 * signed-out users away from protected routes. Add new public pages to
 * PUBLIC_ROUTES as they are built.
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/auth/confirm",
  "/auth/error",
  // Diagnostic. Must stay reachable when auth is broken, since that is
  // exactly when it is needed. It returns presence booleans only to
  // signed-out callers. Remove alongside the route.
  "/api/debug/env",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase is not configured yet. Pass requests through
    // unauthenticated rather than failing every page.
    console.warn(
      "Supabase env vars are not set, skipping auth check. See .env.example.",
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    // Supabase unreachable. Fail closed on protected routes rather than
    // letting an outage either expose them or break public pages.
    console.error("Supabase auth check failed:", error);
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(request.nextUrl.pathname);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
