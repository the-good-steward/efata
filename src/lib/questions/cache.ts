import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generationResult, type GenerationResult } from "./schema";

/**
 * Cache key for a generated question set.
 *
 * Normalised so trivial differences do not miss the cache: the same
 * listing pasted with different whitespace, casing, or trailing junk
 * should hit. Experience and English level are part of the key because
 * they change what is generated; the user is not, because two people at
 * the same level applying to the same job should get the same set.
 */
export function cacheKey(
  jobPost: string,
  experienceLevel: string,
  englishLevel: string,
): string {
  const normalised = jobPost
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  return createHash("sha256")
    .update(`${normalised}|${experienceLevel}|${englishLevel}`)
    .digest("hex");
}

export async function readCache(
  admin: SupabaseClient,
  key: string,
): Promise<GenerationResult | null> {
  const { data, error } = await admin
    .from("question_set_cache")
    .select("payload")
    .eq("cache_key", key)
    .maybeSingle();

  if (error || !data) return null;

  // Validate on the way out as well as in. A cached payload written by
  // an older version of the schema should be ignored, not trusted.
  const parsed = generationResult.safeParse(data.payload);
  if (!parsed.success) return null;

  await admin.rpc("bump_cache_hit", { key });
  return parsed.data;
}

export async function writeCache(
  admin: SupabaseClient,
  key: string,
  payload: GenerationResult,
): Promise<void> {
  const { error } = await admin
    .from("question_set_cache")
    .upsert({ cache_key: key, payload }, { onConflict: "cache_key" });

  // Never fatal: a cache write failing costs money, not correctness.
  if (error) console.error("Cache write failed:", error);
}
