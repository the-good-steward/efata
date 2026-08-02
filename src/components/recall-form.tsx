"use client";

import { useActionState, useRef, useEffect } from "react";
import { logRealQuestion, type RecallState } from "@/app/recall/actions";

export function RecallForm({ sessionId }: { sessionId: string }) {
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
      <input type="hidden" name="session_id" value={sessionId} />
      <label className="flex flex-col gap-2">
        <span className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          The question
        </span>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="As close to their words as you remember."
          className="border-rule text-parchment placeholder:text-ash/50 focus:border-spoken focus:ring-spoken/40 resize-y rounded-sm border bg-transparent px-3 py-2 font-body text-sm leading-relaxed outline-none focus:ring-2"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
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
              <div className="border-rule peer-checked:border-spoken peer-checked:bg-spoken/10 text-parchment font-body rounded-sm border px-3 py-2.5 text-center text-sm transition-colors">
                {option.label}
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="font-body text-sm text-flag">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p
          role="status"
          className="border-lamp/40 bg-lamp/10 text-lamp font-body rounded-sm border px-3 py-2 text-sm"
        >
          Saved. Add another if you remember more.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-parchment text-ink font-body hover:bg-parchment/85 self-start rounded-sm px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add this question"}
      </button>
    </form>
  );
}
