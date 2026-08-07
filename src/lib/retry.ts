/**
 * Retries a call that failed because the service was busy.
 *
 * With fifty people practising at once, Anthropic's per-minute limits
 * get hit. Without this, a rate-limited request simply fails and the
 * person sees an error, even though waiting two seconds would have
 * worked. That turns a busy minute into a broken app.
 *
 * Only retries what is worth retrying. A rejected key or a malformed
 * request will fail identically every time, and retrying those just
 * makes the person wait longer for the same answer.
 */
export type RetryableCheck = (error: unknown) => boolean;

export function isBusy(error: unknown): boolean {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined;

  // 429 rate limited, 529 overloaded, 5xx transient.
  if (status === 429 || status === 529) return true;
  if (typeof status === "number" && status >= 500) return true;

  const message = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("fetch failed")
  );
}

export async function withRetry<T>(
  label: string,
  work: () => Promise<T>,
  options: { attempts?: number; baseMs?: number; retryable?: RetryableCheck } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseMs = options.baseMs ?? 800;
  const retryable = options.retryable ?? isBusy;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await work();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !retryable(error)) throw error;

      // Exponential, with jitter so fifty people who all hit the limit
      // in the same second do not all retry in the same second too.
      const wait = baseMs * 2 ** (attempt - 1) + Math.random() * 400;
      console.warn(
        `${label}: busy, retrying in ${Math.round(wait)}ms (attempt ${attempt} of ${attempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw lastError;
}
