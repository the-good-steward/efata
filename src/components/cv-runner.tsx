"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CvAsk from "@/components/session/CvAsk";
import CvReview from "@/components/session/CvReview";
import CvSkip from "@/components/session/CvSkip";
import { Working } from "@/components/working";
import { uploadCv, confirmCv, skipCv, type CvState } from "@/app/cv/actions";
import type { CvSummary } from "@/lib/cv/extract";

/**
 * The one-time CV step.
 *
 * The review is not a formality. A misread CV produces confident wrong
 * feedback, and someone told they already have experience they do not
 * have would carry that into a real interview. So nothing is used until
 * they have looked at it.
 */
export function CvRunner({ existing }: { existing: CvSummary | null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CvState, FormData>(
    uploadCv,
    {},
  );

  const [skipped, setSkipped] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  if (pending) {
    return (
      <Working
        lines={[
          "Reading your CV",
          "Picking out the roles and the tools",
          "Nearly there",
        ]}
        note="It takes a few seconds. Nothing is used until you have checked it."
      />
    );
  }

  if (existing) {
    return (
      <CvReview
        cv={{
          name: existing.headline || "Your CV",
          headline:
            existing.roles[0]?.title +
              (existing.roles[0]?.employer
                ? ` at ${existing.roles[0].employer}`
                : "") || "No roles were read",
          tools: existing.tools,
        }}
        onConfirm={() => void confirmCv()}
        onEdit={() => fileRef.current?.click()}
        onReplace={() => fileRef.current?.click()}
      />
    );
  }

  if (skipped) {
    return (
      <CvSkip
        onContinue={() => void skipCv()}
        onReconsider={() => setSkipped(false)}
      />
    );
  }

  return (
    <form ref={formRef} action={formAction} className="h-full">
      <input
        ref={fileRef}
        type="file"
        name="cv"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <input
        ref={cameraRef}
        type="file"
        name="cv"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />

      {state.error && (
        <p role="alert" className="bg-clay/10 text-clay px-6 py-3 text-[15px]">
          {state.error}
        </p>
      )}

      <CvAsk
        onChooseFile={() => fileRef.current?.click()}
        onTakePhoto={() => cameraRef.current?.click()}
        onSkip={() => setSkipped(true)}
      />
    </form>
  );
}
