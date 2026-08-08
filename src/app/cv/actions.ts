"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractCv } from "@/lib/cv/extract";
import { recordFailure } from "@/lib/failures";

export type CvState = { error?: string; ok?: boolean };

const MAX_BYTES = 8 * 1024 * 1024;

const ACCEPTED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

/**
 * Reads a CV and stores what it found.
 *
 * The file goes to a private per-user folder, and the summary is kept
 * separately so nothing has to re-read the document later. It is not
 * used anywhere until the person has confirmed it, because a misread CV
 * producing confident wrong feedback is worse than no CV at all.
 */
export async function uploadCv(
  _prev: CvState,
  formData: FormData,
): Promise<CvState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Two inputs carry this name, one for a file and one for the camera,
  // and the unused one submits empty. Take whichever actually holds
  // something rather than the first.
  const file = formData
    .getAll("cv")
    .find((f): f is File => f instanceof File && f.size > 0);

  if (!file) {
    return { error: "Pick a file or take a photo of your CV." };
  }
  if (file.size > MAX_BYTES) {
    return {
      error: "That file is over 8MB. A photo of each page usually works.",
    };
  }
  if (!ACCEPTED.includes(file.type)) {
    return {
      error: "Efata can read a PDF or a photo. Word documents need exporting to PDF first.",
    };
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  let summary;
  try {
    summary = await extractCv({ base64, mediaType: file.type });
  } catch (error) {
    await recordFailure({
      userId: user.id,
      stage: "cv_extract",
      error,
      context: { bytes: file.size, type: file.type },
    });
    return {
      error:
        "Efata couldn't read that one. A clearer photo, or the PDF version, usually works.",
    };
  }

  const path = `${user.id}/cv-${Date.now()}`;
  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, file, { contentType: file.type, upsert: true });

  // A storage failure is not fatal: the summary is what the app uses,
  // and the file is only kept so it can be replaced or removed later.
  if (uploadError) {
    await recordFailure({
      userId: user.id,
      stage: "cv_upload",
      error: uploadError,
      context: { bytes: file.size },
    });
  }

  const { error: saveError } = await supabase.from("cv_profiles").upsert(
    {
      user_id: user.id,
      file_path: uploadError ? null : path,
      summary,
      // Cleared on every upload: a new CV has to be checked again.
      confirmed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (saveError) {
    await recordFailure({
      userId: user.id,
      stage: "cv_save",
      error: saveError,
      context: {},
    });
    return { error: "Couldn't save what we read. Try again." };
  }

  await supabase
    .from("profiles")
    .update({ cv_asked_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/cv");
  return { ok: true };
}

/** Marks the summary as checked, which is what lets it be used. */
export async function confirmCv(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("cv_profiles")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("user_id", user.id);

  revalidatePath("/practice");
  redirect("/practice");
}

/** Asked once. Skipping is recorded so it is not asked again. */
export async function skipCv(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ cv_asked_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/practice");
}
