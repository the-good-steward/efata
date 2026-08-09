"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Working } from "@/components/working";
import { startSituation, type SituationState } from "@/app/situation/actions";

/**
 * Describe a conversation that is coming up, and practise it.
 *
 * The examples matter more than the field. Most people cannot name
 * their own situation cold, but recognise it instantly in someone
 * else's words.
 */
const EXAMPLES = [
  "My client wants me to start handling their inbox, but that was never in what we agreed.",
  "I need to raise my rate with a client I have had for a year.",
  "I am going to miss Friday's deadline and they do not know yet.",
  "They asked me to do something I have never done before and I do not want to lose the work.",
];

export function SituationForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SituationState, FormData>(
    startSituation,
    {},
  );
  const [text, setText] = useState("");

  useEffect(() => {
    if (state.sessionId) router.push(`/practice/${state.sessionId}`);
  }, [state.sessionId, router]);

  if (pending || state.sessionId) {
    return (
      <Working
        lines={[
          "Reading your situation",
          "Working out what they would say",
          "Nearly there",
        ]}
        note="A few seconds. You will hear from them, then it is your turn."
      />
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="ef-label text-ink-3">What is coming up?</span>
        <textarea
          name="situation"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          required
          placeholder="What do they want, and what makes it awkward to say?"
          className="border-edge bg-card text-ink placeholder:text-ink-3/70 w-full rounded-[12px] border p-4 text-[17px] leading-relaxed outline-none"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="ef-caption text-ink-3">Or start from one of these</span>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="border-edge text-ink-2 rounded-[12px] border px-4 py-3 text-left text-[15px] leading-snug"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="ef-body text-clay">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="bg-ink text-paper w-full rounded-full px-8 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90"
      >
        Put me in the moment
      </button>

      <p className="ef-caption text-ink-3">
        You will hear what they say, and answer it out loud. Efata does not
        tell you what to say: you say it your way, then we go through how it
        landed.
      </p>
    </form>
  );
}
