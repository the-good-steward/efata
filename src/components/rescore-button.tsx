"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  rescoreAttempt,
  type RescoreState,
} from "@/app/practice/[sessionId]/actions";

export function RescoreButton({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<RescoreState, FormData>(
    rescoreAttempt,
    {},
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="attempt_id" value={attemptId} />
      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Scoring it now…" : "Get my feedback"}
      </button>

      {state.error && (
        <p role="alert" className="ef-caption text-clay mt-3">
          {state.error}
        </p>
      )}
    </form>
  );
}
