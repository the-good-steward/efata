"use client";

import { useActionState, useRef, useState } from "react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/app/onboarding/actions";
import { Screen, Eyebrow, Primary, Quiet } from "@/components/session/Chrome";

type Role = { id: string; label: string; description: string | null };

const EXPERIENCE = [
  {
    value: "beginner",
    label: "Just starting",
    hint: "New to this, or fewer than about six months in.",
  },
  {
    value: "intermediate",
    label: "Some experience",
    hint: "You have done the work for real clients.",
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

/**
 * One question per screen.
 *
 * This used to be a single page carrying an explanation of the product,
 * three questions and their hints all at once, which is a lot to meet
 * before you have done anything. The session was rebuilt around one
 * thing at a time and the way in should match, especially since this is
 * the first thing anyone sees.
 */
type Step = "role" | "experience" | "english";

export function OnboardingForm({ roles }: { roles: Role[] }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );

  const [step, setStep] = useState<Step>("role");
  const [roleId, setRoleId] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [experience, setExperience] = useState("");
  const [english, setEnglish] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const other = roles.find((r) => r.label.toLowerCase().includes("something"));

  return (
    <form ref={formRef} action={formAction} className="h-full">
      <input type="hidden" name="primary_role_id" value={roleId} />
      <input type="hidden" name="custom_role" value={customRole} />
      <input type="hidden" name="experience_level" value={experience} />
      <input type="hidden" name="english_level" value={english} />

      {step === "role" && (
        <Screen
          footer={
            <Primary
              label="Next"
              onClick={() => setStep("experience")}
              disabled={!roleId && !customRole.trim()}
            />
          }
        >
          <Eyebrow>1 of 3</Eyebrow>
          <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[42px]">
            What kind of work are you going for?
          </h1>

          <div className="flex flex-col gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setRoleId(role.id)}
                className={`rounded-[12px] border px-4 py-3.5 text-left text-[16px] ${
                  roleId === role.id
                    ? "border-sea bg-card text-ink font-semibold"
                    : "border-edge text-ink-2"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] uppercase tracking-[0.14em] text-ink-3">
              Or type it
            </span>
            <input
              type="text"
              value={customRole}
              onChange={(e) => {
                setCustomRole(e.target.value);
                if (e.target.value.trim() && other) setRoleId(other.id);
              }}
              placeholder="Nurse, teacher, engineer, anything"
              className="border-edge bg-card text-ink placeholder:text-ink-3/70 w-full rounded-[12px] border px-4 py-3.5 text-[16px] outline-none"
            />
          </div>
        </Screen>
      )}

      {step === "experience" && (
        <Screen
          footer={
            <div className="flex flex-col gap-2">
              <Primary
                label="Next"
                onClick={() => setStep("english")}
                disabled={!experience}
              />
              <Quiet label="Back" onClick={() => setStep("role")} />
            </div>
          }
        >
          <Eyebrow>2 of 3</Eyebrow>
          <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[42px]">
            How much have you done so far?
          </h1>

          <div className="flex flex-col gap-2">
            {EXPERIENCE.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setExperience(option.value)}
                className={`flex flex-col gap-1 rounded-[12px] border px-4 py-3.5 text-left ${
                  experience === option.value
                    ? "border-sea bg-card"
                    : "border-edge"
                }`}
              >
                <span className="text-ink text-[17px] font-medium">
                  {option.label}
                </span>
                <span className="text-ink-3 text-[14px] leading-snug">
                  {option.hint}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
            This sets how hard the questions are. Nobody sees it.
          </p>
        </Screen>
      )}

      {step === "english" && (
        <Screen
          footer={
            <div className="flex flex-col gap-2">
              <Primary
                label={pending ? "Setting up…" : "Start"}
                onClick={() => formRef.current?.requestSubmit()}
                disabled={!english || pending}
              />
              <Quiet label="Back" onClick={() => setStep("experience")} />
            </div>
          }
        >
          <Eyebrow>3 of 3</Eyebrow>
          <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[42px]">
            How do you feel about English at work?
          </h1>

          <div className="flex flex-col gap-2">
            {ENGLISH.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEnglish(option.value)}
                className={`rounded-[12px] border px-4 py-3.5 text-left text-[16px] ${
                  english === option.value
                    ? "border-sea bg-card text-ink font-semibold"
                    : "border-edge text-ink-2"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {state.error && (
            <p role="alert" className="text-clay text-[16px]">
              {state.error}
            </p>
          )}

          <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
            Answer honestly. It changes the wording of the questions, not how
            hard they are.
          </p>
        </Screen>
      )}
    </form>
  );
}
