"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Working } from "@/components/working";
import { SituationRecorder } from "@/components/situation-recorder";
import { startSituation, type SituationState } from "@/app/situation/actions";

/**
 * Describe a conversation that is coming up, out loud.
 *
 * The examples are there because most people cannot name their own
 * situation cold but recognise it instantly in someone else's words.
 * They are prompts to speak from, not text to submit.
 */
/*
 * Weighted toward the mundane.
 *
 * All four used to be crises, which made this look like somewhere you
 * go when something has gone wrong. Most of what people fumble is
 * much smaller: asking a question they think they should already know
 * the answer to, chasing a message, saying they need a day. Those come
 * up weekly, and getting them wrong is what quietly shapes how a
 * client sees you.
 */
const EXAMPLES = [
  "I do not understand what they are asking for and I have to ask again",
  "They have not replied in four days and I need an answer to carry on",
  "I need a day off next week",
  "I sent something with a mistake in it and they have not noticed yet",
  "They keep messaging me at eleven at night",
  "A client wants me to take on work we never agreed",
  "I need to raise my rate with a client I have had a while",
];

export function SituationForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SituationState, FormData>(
    startSituation,
    {},
  );
  const [ready, setReady] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const audioRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sessionId) router.push(`/practice/${state.sessionId}`);
  }, [state.sessionId, router]);

  if (pending || state.sessionId) {
    return (
      <Working
        lines={[
          "Listening to your situation",
          "Working out what they would say",
          "Nearly there",
        ]}
        note="A few seconds. You will hear from them, then it is your turn."
      />
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <input ref={audioRef} type="file" name="audio" className="hidden" />

      {!typing ? (
        <>
          <SituationRecorder
            onRecorded={(blob) => {
              const transfer = new DataTransfer();
              transfer.items.add(
                new File([blob], "situation.webm", { type: blob.type }),
              );
              if (audioRef.current) audioRef.current.files = transfer.files;
              setReady(true);
            }}
            onCleared={() => {
              if (audioRef.current) audioRef.current.value = "";
              setReady(false);
            }}
          />

          {ready && (
            <button
              type="submit"
              className="bg-sea text-paper w-full rounded-full px-8 py-4 text-[17px] font-semibold"
            >
              Put me in the moment
            </button>
          )}
        </>
      ) : (
        <>
          <label className="flex flex-col gap-2">
            <span className="ef-label text-ink-3">What is coming up?</span>
            <textarea
              name="situation"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="What do they want, and what makes it awkward to say?"
              className="border-edge bg-card text-ink placeholder:text-ink-3/70 w-full rounded-[12px] border p-4 text-[17px] leading-relaxed outline-none"
            />
          </label>
          <button
            type="submit"
            className="bg-ink text-paper w-full rounded-full px-8 py-4 text-[17px] font-semibold"
          >
            Put me in the moment
          </button>
        </>
      )}

      <div className="flex flex-col gap-2">
        <span className="ef-caption text-ink-3">
          {typing
            ? "Anything counts, however small"
            : "Anything counts, however small"}
        </span>
        <ul className="flex flex-col gap-1.5">
          {EXAMPLES.map((example) => (
            <li key={example} className="ef-body text-ink-2">
              · {example}
            </li>
          ))}
        </ul>
      </div>

      {state.error && (
        <p role="alert" className="ef-body text-clay">
          {state.error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setTyping((t) => !t)}
        className="text-ink-3 self-start text-[15px] underline underline-offset-4"
      >
        {typing ? "Record it instead" : "Somewhere you cannot speak? Type it"}
      </button>

      <p className="ef-caption text-ink-3">
        You will hear what they say, and answer it out loud. Efata does not
        tell you what to say: you say it your way, then we go through how it
        landed.
      </p>
    </form>
  );
}
