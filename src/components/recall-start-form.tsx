"use client";

import { useActionState } from "react";
import { startRecallSession, type RecallState } from "@/app/recall/actions";

type Role = { id: string; label: string };

export function RecallStartForm({
  roles,
  defaultRoleId,
}: {
  roles: Role[];
  defaultRoleId: string | null;
}) {
  const [state, formAction, pending] = useActionState<RecallState, FormData>(
    startRecallSession,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-ink-3 font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          The job post
        </span>
        <span className="text-ink-3 font-body -mt-1 text-xs leading-relaxed">
          Paste what you applied to. The same question means something very
          different depending on the role, and this keeps them useful later.
        </span>
        <textarea
          name="job_post"
          rows={8}
          placeholder="Paste the listing, or leave blank if you don't have it."
          className="border-edge text-ink placeholder:text-ink-3/60 focus:border-spoken focus:ring-spoken/40 resize-y rounded-sm border bg-transparent px-3 py-2 font-body text-sm leading-relaxed outline-none focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-ink-3 font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          Name it
        </span>
        <input
          type="text"
          name="title"
          placeholder="e.g. Social media VA, Sydney skincare brand"
          className="border-edge text-ink placeholder:text-ink-3/60 focus:border-spoken rounded-sm border bg-transparent px-3 py-2 font-body text-sm outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-ink-3 font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          Role
        </span>
        <select
          name="role_id"
          defaultValue={defaultRoleId ?? ""}
          className="border-edge text-ink focus:border-spoken rounded-sm border bg-transparent px-3 py-2 font-body text-sm outline-none"
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
        {pending ? "Starting…" : "Next: add the questions"}
      </button>
    </form>
  );
}
