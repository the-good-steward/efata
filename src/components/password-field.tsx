"use client";

import { useState } from "react";

/**
 * Password input with a show/hide toggle.
 *
 * The control is the words "Show" and "Hide" rather than an eye icon:
 * an icon has to be learned, and a good number of these users are
 * typing in a second language on a phone keyboard where a mistyped
 * character is invisible and the only feedback is a rejected login.
 *
 * Defaults to hidden, since practising somewhere public is common.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  hint,
  value,
  onChange,
}: {
  name: string;
  label: string;
  autoComplete: string;
  hint?: string;
  /** Controlled so a failed submit does not wipe what was typed. */
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2">
      <span className="ef-label text-faint">{label}</span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          required
          minLength={8}
          {...(onChange
            ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
            : {})}
          className="border-edge text-paper focus:border-seaglass w-full rounded-[12px] border bg-transparent py-3 pr-20 pl-4 text-[17px] outline-none"
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-muted hover:text-paper absolute top-1/2 right-1 -translate-y-1/2 rounded-full px-4 text-[15px] font-medium transition-colors"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {hint && <span className="ef-caption text-faint">{hint}</span>}
    </label>
  );
}
