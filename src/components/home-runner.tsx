"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Home from "@/components/session/Home";
import Building from "@/components/session/Building";
import { createSession, type SessionState } from "@/app/practice/actions";

/**
 * The start of a session: paste or screenshots, then the build.
 *
 * The forty second wait is the intro card rather than a spinner
 * followed by one, so the only thing a first-timer has to read happens
 * while they are already waiting.
 */
export function HomeRunner({ questionCount }: { questionCount: number }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SessionState, FormData>(
    createSession,
    {},
  );

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pct, setPct] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Separate from the input the form submits: this one only opens the
  // picker, so its value can be cleared after every pick without
  // disturbing what is queued for upload.
  const pickerRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sessionId) router.push(`/practice/${state.sessionId}`);
  }, [state.sessionId, router]);

  /**
   * Keep the file input in step with the list on screen.
   *
   * The input owns what actually gets uploaded, so removing a
   * screenshot from the list without rewriting the input would send a
   * file the person thought they had deleted.
   */
  useEffect(() => {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    inputRef.current.files = transfer.files;
  }, [files]);

  // A hairline that advances while the model works. Not a real measure
  // of progress, and it never reaches the end on its own.
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => setPct((p) => Math.min(p + 3, 92)), 1200);
    return () => clearInterval(timer);
  }, [pending]);

  const building = pending || Boolean(state.sessionId);

  if (building) {
    return (
      <Building
        ready={Boolean(state.sessionId)}
        pct={state.sessionId ? 100 : pct}
        questionCount={questionCount}
        onStart={() =>
          state.sessionId && router.push(`/practice/${state.sessionId}`)
        }
        onCancel={() => router.refresh()}
      />
    );
  }

  return (
    <form ref={formRef} action={formAction} className="h-full">
      <input type="hidden" name="job_post" value={text} />
      {/* Submitted with the form. Kept in step with the list below. */}
      <input
        ref={inputRef}
        type="file"
        name="screenshots"
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
      />

      {/* Opens the picker. Cleared after each pick so choosing the same
          file twice still fires a change event. */}
      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const picked = Array.from(event.target.files ?? []);
          setFiles((current) => [...current, ...picked].slice(0, 6));
          event.target.value = "";
        }}
      />

      {state.error && (
        <div
          role="alert"
          className="bg-clay/10 flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3"
        >
          <p className="text-clay text-[15px]">{state.error}</p>
          {state.error.includes("drill") && (
            <Link
              href="/drill"
              className="text-sea min-h-11 text-[15px] font-medium underline underline-offset-4"
            >
              Go to today&rsquo;s drill
            </Link>
          )}
        </div>
      )}

      <Home
        pastedText={text}
        screenshots={files.map((f, i) => ({ id: `${i}-${f.name}`, name: f.name }))}
        onPaste={setText}
        onAddScreenshot={() => pickerRef.current?.click()}
        onRemoveScreenshot={(id) =>
          setFiles((current) =>
            current.filter((f, i) => `${i}-${f.name}` !== id),
          )
        }
        onBuild={() => formRef.current?.requestSubmit()}
        shortcuts={
          /*
           * Inline rather than floating.
           * A round button in the corner of this page will always
           * crowd the primary action, because they want the same
           * space. Here they sit under it as what they are: the two
           * shorter things, offered without competing.
           */
          <div className="border-hairline flex items-center gap-4 border-t pt-4">
            <span className="ef-caption text-ink-3 shrink-0">
              Short on time?
            </span>
            <Link
              href="/drill"
              prefetch
              className="text-sea text-[15px] font-medium underline underline-offset-4"
            >
              Today&rsquo;s drill
            </Link>
            <Link
              href="/situation"
              prefetch
              className="text-sea text-[15px] font-medium underline underline-offset-4"
            >
              Something you have to say
            </Link>
          </div>
        }
      />
    </form>
  );
}
