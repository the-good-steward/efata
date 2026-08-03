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
    return { error: "That email and password don't match." };
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    return { error: error.message };
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
