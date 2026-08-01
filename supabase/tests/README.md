# Schema tests

These verify the security boundaries in `../migrations/0001_initial_schema.sql`
against a real Postgres, without touching the live Supabase project.

`00_supabase_stub.sql` recreates the parts of Supabase the migration
depends on (the `auth` schema, `auth.uid()`, the `authenticated` and
`anon` roles).

`01_seed.sql` inserts two users (one free, one paid) and three questions
(free approved, paid approved, pending). It deliberately ends with a
blanket `grant update on all tables`, simulating a careless later
migration, so the tests prove the trigger backstop holds even when the
column grants have been undone.

## Running

```bash
createdb efata_test
psql -d efata_test -f 00_supabase_stub.sql
psql -v ON_ERROR_STOP=1 -d efata_test -f ../migrations/0001_initial_schema.sql
psql -d efata_test -f 01_seed.sql
```

## What must hold

1. A user cannot change their own `tier` (raises an exception).
2. A user can still edit `display_name`, `primary_role_id`, `english_level`.
3. A free user sees only free, approved questions.
4. No client role can read `question_answer_keys` at all.
5. `service_role` can still change `tier`, so billing works.
