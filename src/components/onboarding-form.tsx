"use client";

import { useActionState, useState } from "react";
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
  const [roleId, setRoleId] = useState("");

  const otherRole = roles.find((role) => role.label === "Something else");
  const showCustom = otherRole ? roleId === otherRole.id : false;

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-12">
      <section className="border-hairline border-b pb-10">
        <p className="ef-label text-ink-3">How Efata works</p>

        <div className="mt-5 flex flex-col gap-6">
          <div>
            <p className="font-serif text-ink text-[19px]">Practice sessions</p>
            <p className="ef-body text-ink-2 mt-1">
              Paste a job post you are applying for. Efata builds the questions
              you are likely to face, you answer them out loud, and it shows you
              how you came across.
            </p>
          </div>

          <div>
            <p className="font-serif text-ink text-[19px]">Daily drills</p>
            <p className="ef-body text-ink-2 mt-1">
              One question and one habit, about three minutes. Saying the number
              and stopping. Cutting the apology. A session teaches you about one
              job; a drill builds something you keep.
            </p>
          </div>
        </div>

        <p className="ef-caption text-ink-3 mt-5">
          Sessions are the deep work, drills are the daily habit. Most people
          get further with both than with either.
        </p>
      </section>

      <fieldset>
        <legend className="text-ink font-display text-xl">
          What kind of work are you going for?
        </legend>
        <p className="text-ink-3 font-body mt-2 text-sm">
          Pick the closest match, or choose &ldquo;Something else&rdquo; if
          your work isn&rsquo;t listed. Either way you can paste any job post
          and get questions for it.
        </p>
        <select
          name="primary_role_id"
          required
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          className="border-edge text-ink focus:border-spoken mt-5 w-full rounded-sm border bg-transparent px-3 py-2.5 font-body text-sm outline-none"
        >
          <option value="" disabled className="bg-ink">
            Choose a role
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id} className="bg-ink">
              {role.label}
            </option>
          ))}
        </select>

        {showCustom && (
          <input
            type="text"
            name="custom_role"
            required
            placeholder="What do you call your work? e.g. legal transcriptionist"
            className="border-edge text-ink placeholder:text-ink-3/60 focus:border-spoken mt-3 w-full rounded-sm border bg-transparent px-3 py-2.5 font-body text-sm outline-none"
          />
        )}
      </fieldset>

      <fieldset>
        <legend className="text-ink font-display text-xl">
          How much experience do you have in it?
        </legend>
        <p className="text-ink-3 font-body mt-2 text-sm">
          This sets how hard the questions are. Be honest rather than
 ambitious, questions pitched above you teach you less.
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
              <div className="border-hairline peer-checked:border-spoken peer-checked:bg-seaglass/10 rounded-sm border px-4 py-3 transition-colors">
                <span className="text-ink font-body text-sm">
                  {option.label}
                </span>
                <p className="text-ink-3 font-body mt-1 text-xs leading-relaxed">
                  {option.hint}
                </p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-ink font-display text-xl">
          How do you feel speaking English at work?
        </legend>
        <p className="text-ink-3 font-body mt-2 text-sm">
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
              <div className="border-hairline peer-checked:border-spoken peer-checked:bg-seaglass/10 rounded-sm border px-4 py-3 transition-colors">
                <span className="text-ink font-body text-sm">
                  {option.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="font-body text-sm text-clay">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Start practising"}
      </button>

      <p className="text-ink-3 font-body -mt-6 text-xs">
        You can change any of this later.
      </p>
    </form>
  );
}
