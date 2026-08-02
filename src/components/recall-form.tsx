"use client";

import { useActionState, useRef, useEffect } from "react";
import { logRealQuestion, type RecallState } from "@/app/recall/actions";

type Role = { id: string; label: string };

export function RecallForm({
  roles,
  defaultRoleId,
}: {
  roles: Role[];
  defaultRoleId: string | null;
}) {
  const [state, formAction, pending] = useActionState<RecallState, FormData>(
    logRealQuestion,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a save so the next question can go straight in.
  // People usually remember several at once, and making them clear the
  // box by hand is enough friction to stop them at one.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
          The question
        </span>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="As close to their words as you remember."
          className="border-rule text-parchment placeholder:text-ash/50 focus:border-gold focus:ring-gold/40 resize-y rounded-sm border bg-transparent px-3 py-2 font-body text-sm leading-relaxed outline-none focus:ring-2"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-ash font-body text-xs tracking-[0.2em] uppercase">
          What kind of question
        </legend>
        <div className="mt-1 flex gap-2">
          {[
            { value: "technical", label: "About the work itself" },
            { value: "hypothetical", label: "About handling a situation" },
          ].map((option) => (
            <label key={option.value} className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                value={option.value}
                required
                className="peer sr-only"
              />
              <div className="border-rule peer-checked:border-gold peer-checked:bg-gold/5 text-parchment font-body rounded-sm border px-3 py-2.5 text-center text-sm transition-colors">
                {option.label}
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
          Role it was for
        </span>
        <select
          name="role_id"
          defaultValue={defaultRoleId ?? ""}
          className="border-rule text-parchment focus:border-gold rounded-sm border bg-transparent px-3 py-2 font-body text-sm outline-none"
        >
          <option value="" className="bg-ink">
            Not sure
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id} className="bg-ink">
              {role.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="caught_out"
          value="yes"
          className="border-rule accent-gold mt-1 h-4 w-4"
        />
        <span className="text-parchment font-body text-sm leading-relaxed">
          This one caught me out
          <span className="text-ash block text-xs">
            The ones you fumbled are the most useful to everyone else.
          </span>
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-ash font-body text-xs tracking-[0.2em] uppercase">
          Anything else (optional)
        </span>
        <input
          type="text"
          name="context"
          placeholder="Where it was, what kind of client, how it went."
          className="border-rule text-parchment placeholder:text-ash/50 focus:border-gold rounded-sm border bg-transparent px-3 py-2 font-body text-sm outline-none"
        />
      </label>

      {state.error && (
        <p role="alert" className="font-body text-sm text-red-300">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p
          role="status"
          className="border-gold/40 bg-gold/10 text-gold font-body rounded-sm border px-3 py-2 text-sm"
        >
          Saved. Add another if you remember more.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-parchment text-ink font-body hover:bg-gold self-start rounded-sm px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add this question"}
      </button>
    </form>
  );
}
