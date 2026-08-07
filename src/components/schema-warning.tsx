import { findSchemaGaps } from "@/lib/schema-check";

/**
 * Shown only when a migration has not been applied.
 *
 * Deliberately loud and deliberately specific: the point is that a
 * skipped migration stops being invisible. It names the migration, what
 * is missing, and what silently stopped working because of it.
 */
export async function SchemaWarning() {
  const gaps = await findSchemaGaps();
  if (gaps.length === 0) return null;

  return (
    <div className="border-clay/50 bg-clay/10 mb-8 rounded-[16px] border p-5">
      <p className="ef-ui text-clay">
        {gaps.length === 1
          ? "A migration hasn't been run"
          : `${gaps.length} migrations haven't been run`}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {gaps.map((gap) => (
          <li key={gap.migration}>
            <p className="ef-body text-paper">
              <span className="tabular-nums">{gap.migration}</span> · missing{" "}
              <span className="text-clay">{gap.missing}</span>
            </p>
            <p className="ef-caption text-ink-3">{gap.breaks}</p>
          </li>
        ))}
      </ul>

      <p className="ef-caption text-ink-3 mt-4">
        Run the matching file from supabase/migrations in the SQL editor.
        Until then that feature is quietly doing nothing.
      </p>
    </div>
  );
}
