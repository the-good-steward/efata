import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Record a failure somewhere durable.
 *
 * console.error goes to Vercel's logs, which age out and are hard to
 * search once a tester has already given up and messaged you. This
 * writes the same information where it can be queried later.
 *
 * Never throws: a logging failure must not become the error.
 */
export async function recordFailure(params: {
  userId: string | null;
  stage: string;
  error: unknown;
  context?: Record<string, unknown>;
}): Promise<void> {
  const message =
    params.error instanceof Error
      ? params.error.message
      : String(params.error ?? "unknown");

  console.error(`[${params.stage}]`, message, params.context ?? {});

  try {
    const admin = createAdminClient();
    await admin.from("failures").insert({
      user_id: params.userId,
      stage: params.stage,
      message: message.slice(0, 2000),
      context: params.context ?? {},
    });
  } catch (loggingError) {
    console.error("Could not record failure:", loggingError);
  }
}
