"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/auth/actions";

type Props = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-parchment font-display text-4xl">
        {isSignup ? "Create your account" : "Sign in"}
      </h1>
      <p className="text-ash font-body mt-3 text-sm leading-relaxed">
        {isSignup
          ? "Start practicing the conversations that win the work."
          : "Pick up where you left off."}
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="border-rule text-parchment focus:border-gold focus:ring-gold/40 rounded-sm border bg-transparent px-3 py-2 text-base outline-none focus:ring-2"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
            className="border-rule text-parchment focus:border-gold focus:ring-gold/40 rounded-sm border bg-transparent px-3 py-2 text-base outline-none focus:ring-2"
          />
          {isSignup && (
            <span className="text-ash font-body text-xs">
              At least 8 characters.
            </span>
          )}
        </label>

        {state.error && (
          <p
            role="alert"
            className="font-body rounded-sm border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          >
            {state.error}
          </p>
        )}

        {state.message && (
          <p
            role="status"
            className="border-gold/40 bg-gold/10 text-gold font-body rounded-sm border px-3 py-2 text-sm"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-parchment text-ink font-body hover:bg-gold focus-visible:ring-gold focus-visible:ring-offset-ink mt-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
        >
          {pending
            ? isSignup
              ? "Creating account…"
              : "Signing in…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-ash font-body mt-6 text-sm">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-parchment hover:text-gold underline underline-offset-4 transition-colors"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
