"use client";

import { useActionState } from "react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/app/onboarding/actions";

type Role = { id: string; label: string; description: string | null };

const EXPERIENCE = [
  {
    value: "beginner",
    label: "Just starting",
    hint: "New to this kind of work, or fewer than about six months in.",
  },
  {
    value: "intermediate",
    label: "Some experience",
    hint: "You've done the work for real clients and can hold your own.",
  },
  {
    value: "expert",
    label: "Experienced",
    hint: "Years of it. You could train someone else.",
  },
];

const ENGLISH = [
  { value: "basic", label: "Still building confidence" },
  { value: "conversational", label: "Comfortable in everyday conversation" },
  { value: "professional", label: "Comfortable in professional settings" },
  { value: "fluent", label: "Fully fluent" },
];

export function OnboardingForm({ roles }: { roles: Role[] }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-12">
      <fieldset>
        <legend className="text-parchment font-display text-xl">
          What kind of work are you going for?
        </legend>
        <div className="mt-5 flex flex-col gap-2">
          {roles.map((role) => (
            <label key={role.id} className="cursor-pointer">
              <input
                type="radio"
                name="primary_role_id"
                value={role.id}
                required
                className="peer sr-only"
              />
              <div className="border-rule peer-checked:border-gold peer-checked:bg-gold/5 rounded-sm border px-4 py-3 transition-colors">
                <span className="text-parchment font-body text-sm">
                  {role.label}
                </span>
                {role.description && (
                  <p className="text-ash font-body mt-1 text-xs leading-relaxed">
                    {role.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-parchment font-display text-xl">
          How much experience do you have in it?
        </legend>
        <p className="text-ash font-body mt-2 text-sm">
          This sets how hard the questions are. Be honest rather than
          ambitious — questions pitched above you teach you less.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {EXPERIENCE.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="experience_level"
                value={option.value}
                required
                className="peer sr-only"
              />
              <div className="border-rule peer-checked:border-gold peer-checked:bg-gold/5 rounded-sm border px-4 py-3 transition-colors">
                <span className="text-parchment font-body text-sm">
                  {option.label}
                </span>
                <p className="text-ash font-body mt-1 text-xs leading-relaxed">
                  {option.hint}
                </p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-parchment font-display text-xl">
          How do you feel speaking English at work?
        </legend>
        <p className="text-ash font-body mt-2 text-sm">
          Separate from experience. This changes how questions are worded, not
          how hard they are.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {ENGLISH.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="english_level"
                value={option.value}
                required
                className="peer sr-only"
              />
              <div className="border-rule peer-checked:border-gold peer-checked:bg-gold/5 rounded-sm border px-4 py-3 transition-colors">
                <span className="text-parchment font-body text-sm">
                  {option.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="font-body text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-parchment text-ink font-body hover:bg-gold self-start rounded-sm px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Start practising"}
      </button>

      <p className="text-ash font-body -mt-6 text-xs">
        You can change any of this later.
      </p>
    </form>
  );
}
