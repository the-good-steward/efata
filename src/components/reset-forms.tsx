"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  requestPasswordReset,
  updatePassword,
  type AuthState,
} from "@/app/auth/actions";
import { Mark } from "@/components/logo";
import { PasswordField } from "@/components/password-field";

const field =
  "border-edge text-ink focus:border-seaglass w-full rounded-[12px] border bg-transparent px-4 py-3 text-[17px] outline-none";
const primary =
  "bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-sm">
      <Mark size={36} />
      <h1 className="ef-display text-paper mt-8">Forgotten password</h1>
      <p className="ef-body text-ink-2 mt-4">
        Give us the email you signed up with and we&rsquo;ll send a link to set
        a new one.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="ef-label text-ink-3">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        </label>

        {state.error && (
          <p role="alert" className="ef-body text-clay">
            {state.error}
          </p>
        )}

        {state.message && (
          <p
            role="status"
            className="ef-body border-seaglass/40 bg-seaglass/10 text-seaglass rounded-[12px] border px-4 py-3"
          >
            {state.message}
          </p>
        )}

        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Sending…" : "Send the link"}
        </button>
      </form>

      <p className="ef-body text-ink-3 mt-6">
        <Link
          href="/login"
          className="hover:text-paper underline underline-offset-4 transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {},
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <div className="w-full max-w-sm">
      <Mark size={36} />
      <h1 className="ef-display text-paper mt-8">Set a new password</h1>
      <p className="ef-body text-ink-2 mt-4">
        Eight characters or more. You&rsquo;ll be signed in straight after.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />

        <PasswordField
          name="confirm"
          label="Again"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />

        {state.error && (
          <p role="alert" className="ef-body text-clay">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving…" : "Save and sign in"}
        </button>
      </form>
    </div>
  );
}
