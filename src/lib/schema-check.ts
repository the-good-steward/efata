import { createClient } from "@/lib/supabase/server";

/**
 * Checks that the tables and columns the app expects actually exist.
 *
 * Migrations are applied by hand, so a skipped one disables a feature
 * silently. That is exactly what happened with the failures table: it
 * was never created, every failure written to it was swallowed, and
 * several rounds of debugging proceeded as though the logging were
 * running.
 *
 * A missing piece should announce itself rather than quietly doing
 * nothing.
 */
export type SchemaGap = {
  migration: string;
  missing: string;
  breaks: string;
};

const EXPECTED: {
  migration: string;
  table: string;
  column?: string;
  breaks: string;
}[] = [
  { migration: "0004", table: "calibrations", breaks: "Calibration scoring" },
  {
    migration: "0005",
    table: "profiles",
    column: "experience_level",
    breaks: "Question difficulty matching experience",
  },
  {
    migration: "0006",
    table: "attempt_feedback",
    breaks: "Users reporting bad feedback",
  },
  {
    migration: "0007",
    table: "roles",
    column: "technical_focus",
    breaks: "Role-specific technical questions",
  },
  {
    migration: "0008",
    table: "profiles",
    column: "custom_role",
    breaks: "Roles outside the listed ones",
  },
  {
    migration: "0009",
    table: "question_set_cache",
    breaks: "Question caching, so every generation is paid for again",
  },
  {
    migration: "0013",
    table: "profiles",
    column: "guide_seen_at",
    breaks: "Remembering that someone has seen the guide",
  },
  {
    migration: "0010",
    table: "failures",
    breaks: "Failure logging, so problems leave no trace",
  },
];

export async function findSchemaGaps(): Promise<SchemaGap[]> {
  const supabase = await createClient();
  const gaps: SchemaGap[] = [];

  await Promise.all(
    EXPECTED.map(async (item) => {
      const { error } = await supabase
        .from(item.table)
        .select(item.column ?? "*")
        .limit(1);

      if (!error) return;

      // 42P01 is a missing table, 42703 a missing column. Anything else
      // (an empty table, a policy denying reads) is not a schema gap.
      const code = (error as { code?: string }).code;
      if (code !== "42P01" && code !== "42703" && !/does not exist/i.test(error.message)) {
        return;
      }

      gaps.push({
        migration: item.migration,
        missing: item.column ? `${item.table}.${item.column}` : item.table,
        breaks: item.breaks,
      });
    }),
  );

  return gaps.sort((a, b) => a.migration.localeCompare(b.migration));
}
