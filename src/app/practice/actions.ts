"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkSessionLimit, type Tier } from "@/lib/limits";
import { cacheKey, readCache, writeCache } from "@/lib/questions/cache";
import { recordFailure } from "@/lib/failures";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateQuestions,
  type EnglishLevel,
  type ExperienceLevel,
  type RoleOption,
} from "@/lib/questions/generate";

export type SessionState = { error?: string; sessionId?: string };

const MIN_JOB_POST = 80;
const MAX_JOB_POST = 12000;

export async function createSession(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const jobPost = String(formData.get("job_post") ?? "").trim();

  if (jobPost.length < MIN_JOB_POST) {
    return {
      error:
        "That's too short to work from. Paste the full job post, including the responsibilities.",
    };
  }
  if (jobPost.length > MAX_JOB_POST) {
    return { error: "That job post is too long. Paste just the role details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("english_level, experience_level, custom_role, tier")
    .eq("id", user.id)
    .single();

  const englishLevel = (profile?.english_level ?? "conversational") as EnglishLevel;
  const experienceLevel = (profile?.experience_level ??
    "beginner") as ExperienceLevel;

  const { data: roleRows } = await supabase
    .from("roles")
    .select("slug, label, technical_focus");

  // The generation call runs several web searches and is by far the most
  // expensive thing the app does, so check the cache before paying for
  // it. Job posts repeat: cross-posted listings, agency templates, and
  // a cohort practising the same role.
  const admin = createAdminClient();
  const key = cacheKey(jobPost, experienceLevel, englishLevel);

  let generated = await readCache(admin, key);
  const cacheHit = Boolean(generated);

  // Only a real generation costs money, so only a real generation is
  // rationed. Someone re-practising a job post a friend already used
  // should never hit a wall for it.
  if (!generated) {
    const limit = await checkSessionLimit(
      supabase,
      user.id,
      (profile?.tier ?? "free") as Tier,
    );
    if (!limit.allowed) return { error: limit.message };
  }

  try {
    if (!generated) generated = await generateQuestions(
      jobPost,
      englishLevel,
      experienceLevel,
      (roleRows ?? []) as RoleOption[],
      (profile?.custom_role as string | null) ?? null,
    );
  } catch (error) {
    await recordFailure({
      userId: user.id,
      stage: "generation",
      error,
      context: { jobPostChars: jobPost.length, experienceLevel, englishLevel },
    });
    return { error: describeGenerationError(error) };
  }

  if (!cacheHit) await writeCache(admin, key, generated);

  // maybeSingle, not single: an untagged session is fine, a crash is not.
  const { data: role } = generated.role_slug
    ? await admin
        .from("roles")
        .select("id")
        .eq("slug", generated.role_slug)
        .maybeSingle()
    : { data: null };

  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .insert({
      user_id: user.id,
      role_id: role?.id ?? null,
      job_post: jobPost,
      title: generated.title,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Session insert failed:", sessionError);
    return { error: describeDbError("saving the session", sessionError) };
  }

  const { data: inserted, error: questionsError } = await admin
    .from("questions")
    .insert(
      generated.questions.map((q) => ({
        role_id: role?.id ?? null,
        type: q.type,
        // Hypotheticals are scored on situational judgment, not STAR;
        // STAR only applies to genuine recall questions.
        rubric: q.type === "technical" ? "technical" : "situational",
        body: q.body,
        context: q.context ?? null,
        difficulty: q.difficulty,
        tier: "free",
        source: "generated",
        status: "pending",
        // Ownership is what makes these readable under RLS: the read
        // policy allows approved questions OR your own submissions.
        submitted_by: user.id,
      })),
    )
    .select("id");

  if (questionsError || !inserted) {
    console.error("Question insert failed:", questionsError);
    return { error: describeDbError("saving the questions", questionsError) };
  }

  const links = inserted.map((q, index) => ({
    session_id: session.id,
    question_id: q.id,
    position: index + 1,
  }));

  const { error: linkError } = await admin
    .from("session_questions")
    .insert(links);

  if (linkError) {
    console.error("session_questions insert failed:", linkError);
    return { error: describeDbError("assembling the session", linkError) };
  }

  // Answer keys are stored separately and never exposed to the client.
  const keys = generated.questions
    .map((q, index) =>
      q.markers ? { question_id: inserted[index].id, markers: q.markers } : null,
    )
    .filter((k) => k !== null);

  if (keys.length > 0) {
    const { error: keyError } = await admin
      .from("question_answer_keys")
      .insert(keys);
    // Non-fatal: the session is still usable without keys, they only
    // affect how precisely technical answers get scored later.
    if (keyError) console.error("Answer key insert failed:", keyError);
  }

  revalidatePath("/practice");
  return { sessionId: session.id };
}

/**
 * Turns a generation failure into something actionable.
 *
 * A single catch-all message ("try a more detailed job post") is
 * actively misleading when the real cause is a missing API key or a
 * wrong model name: it sends the user editing their input when nothing
 * about the input is wrong. Configuration problems say so plainly.
 */
function describeGenerationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined;

  if (message.includes("ANTHROPIC_API_KEY is not set")) {
    return "The AI service isn't configured yet. ANTHROPIC_API_KEY is missing.";
  }
  if (status === 401 || status === 403) {
    return "The AI service rejected our credentials. The API key may be invalid or revoked.";
  }
  if (status === 404) {
    return `The AI model wasn't found. Check the model name. (${message})`;
  }
  if (status === 429) {
    return "The AI service is rate limited right now. Wait a moment and try again.";
  }
  if (message.toLowerCase().includes("credit")) {
    return "The Anthropic account is out of credit. Top it up at console.anthropic.com.";
  }
  if (status === 400) {
    return `The AI service rejected the request. (${message})`;
  }
  if (message.includes("ran out of output budget")) {
    return "The response was cut off before it finished. Try a shorter job post.";
  }
  if (message.includes("failed validation")) {
    return `The questions came back in the wrong shape. (${message})`;
  }
  if (message.includes("valid JSON") || message.includes("returned no text")) {
    return "The AI returned something unreadable. Try again — this is usually transient.";
  }

  // Include the underlying message. A bare "try again" on an error we
  // did not anticipate sends the user editing input that was never the
  // problem, which is exactly how the last few of these went.
  return `Couldn't build questions from that job post. ${message.slice(0, 160)}`;
}

/**
 * Surfaces the underlying database error instead of a generic retry
 * message. The generation step is now working, so failures here are
 * configuration or schema problems that a retry will never fix, and
 * hiding the cause just costs another round trip.
 */
function describeDbError(
  during: string,
  error: { message?: string; code?: string; hint?: string } | null,
): string {
  if (!error) return `Something went wrong ${during}.`;

  const message = error.message ?? "";

  // A service-role key that the project rejects is the most likely
  // cause once generation itself works.
  if (
    message.toLowerCase().includes("invalid api key") ||
    message.toLowerCase().includes("jwt") ||
    error.code === "PGRST301"
  ) {
    return "The database rejected our credentials. SUPABASE_SERVICE_ROLE_KEY may be the wrong key for this project.";
  }

  if (error.code === "42P01") {
    return "A required table is missing. The schema migration may not have run.";
  }

  if (error.code === "42501") {
    return "Permission denied writing to the database. The service role key may be wrong.";
  }

  const code = error.code ? ` [${error.code}]` : "";
  return `Failed while ${during}${code}: ${message}`;
}
