"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

function validate(email: string, password: string): string | null {
  if (!email || !password) return "Enter your email and password.";
  if (!email.includes("@")) return "That email address is not valid.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  const invalid = validate(email, password);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Don't reveal whether the address exists.
    // Deliberately does not say which of the two was wrong: naming it
    // would turn the form into a way to check whether an address has an
    // account. The nudge toward a reset is the useful part.
    return {
      error:
 "That email and password don't match. Check for a typo, the Show button will let you read it back.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/practice");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  // Enforced here as well as in the page. Hiding the form only hides
  // it; the action is still reachable by anyone who wants to post to
  // it directly.
  if (process.env.EFATA_SIGNUPS_CLOSED === "true") {
    return {
      error: "New signups are paused for a couple of days while I fix something.",
    };
  }

  const { email, password } = readCredentials(formData);

  const invalid = validate(email, password);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    return { error: error.message };
  }

  // With email confirmation switched off, Supabase returns a session
  // straight away. Go on into the app rather than telling someone to
  // check an inbox for a message that will never arrive.
  //
  // This also sidesteps the confirmation link breaking when signup
  // starts in one browser and the email opens in another — which is
  // what happens by default when a link is shared through Messenger,
  // since it opens in an in-app browser.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    message: `Check ${email} for a confirmation link, then sign in.`,
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Send a reset link.
 *
 * Always reports success, even for an address with no account. Saying
 * "no account found" turns this form into a way to discover who has
 * signed up, which matters more than usual when the users are
 * freelancers who may not want that known.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Enter the email you signed up with." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/auth/reset`,
  });

  // Logged, not shown: a mail failure must not reveal whether the
  // address exists either.
  if (error) console.error("Password reset request failed:", error);

  return {
    message: `If ${email} has an account, a reset link is on its way. It expires in an hour.`,
  };
}

/**
 * Set a new password.
 *
 * The recovery link signs the person in before they reach this, so the
 * session is the proof of identity. No old password is asked for —
 * they are here because they do not have it.
 */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Those two passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "That reset link has expired or was already used. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/practice");
}
