"use client";

import Link from "next/link";
import { Mark } from "@/components/logo";
import { PasswordField } from "@/components/password-field";
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
      <Mark size={36} className="text-parchment mb-8" />
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
          <span className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="border-rule text-parchment focus:border-spoken focus:ring-spoken/40 rounded-sm border bg-transparent px-3 py-2 text-base outline-none focus:ring-2"
          />
        </label>

        <PasswordField
          name="password"
          label="Password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          hint={isSignup ? "At least 8 characters." : undefined}
        />

        {state.error && (
          <p
            role="alert"
            className="font-body rounded-sm border border-flag/40 bg-flag/10 px-3 py-2 text-sm text-flag"
          >
            {state.error}
          </p>
        )}

        {state.message && (
          <p
            role="status"
            className="border-lamp/40 bg-lamp/10 text-lamp font-body rounded-sm border px-3 py-2 text-sm"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-parchment text-ink font-body hover:bg-parchment/85 focus-visible:ring-spoken focus-visible:ring-offset-ink mt-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
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

      {!isSignup && (
        <p className="ef-body text-muted mt-6">
          <Link
            href="/forgot"
            className="hover:text-paper underline underline-offset-4 transition-colors"
          >
            Forgotten your password?
          </Link>
        </p>
      )}

      <p className="text-ash font-body mt-6 text-sm">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-parchment hover:text-spoken inline-flex min-h-[44px] items-center underline underline-offset-4 transition-colors"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
