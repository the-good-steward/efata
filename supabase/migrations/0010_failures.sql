-- Record failures where they can be read.
--
-- Four rounds have now been spent inferring why an answer did not save,
-- from screenshots and a tester's description. Vercel's logs age out
-- and are awkward to search after the fact. This keeps a durable record
-- of what actually broke, for whom, and with what message.
--
-- No RLS policy: written and read only with the service role, so a user
-- cannot see or forge another person's failures. Query it from the SQL
-- editor.

create table failures (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  -- Where it broke: transcription, evaluation, upload, insert, update.
  stage      text not null,
  message    text,
  -- Anything that helps reproduce: audio size and type, duration,
  -- question rubric, attempt number.
  context    jsonb,
  created_at timestamptz not null default now()
);

create index failures_created_idx on failures (created_at desc);
create index failures_stage_idx on failures (stage, created_at desc);

alter table failures enable row level security;
