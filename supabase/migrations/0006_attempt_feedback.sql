-- Feedback on the feedback.
--
-- Deliberately not a satisfaction rating. People are most satisfied
-- when they are told they did well, so optimising for satisfaction
-- pushes the evaluator toward flattery — the exact failure this app
-- cannot afford, since a generous score sends someone into a real
-- client call overconfident.
--
-- Instead this asks the things a user can actually judge reliably:
-- whether the feedback was usable, and whether something was wrong with
-- it. Someone who does not know the right answer cannot tell us our
-- technical correction was wrong, but they can always tell us we
-- misheard them or missed their point.

create type feedback_issue as enum (
  'wrong_facts',      -- said something incorrect about the work
  'misunderstood',    -- missed the point of what they said
  'transcript_wrong', -- mis-heard the words
  'too_harsh',
  'too_generic',      -- true but useless, could apply to anyone
  'other'
);

create table attempt_feedback (
  id         uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  -- Did it tell them something they can use? A more answerable question
  -- than whether they liked it.
  useful     boolean not null,
  issue      feedback_issue,
  note       text,
  created_at timestamptz not null default now(),
  unique (attempt_id, user_id)
);

create index attempt_feedback_issue_idx
  on attempt_feedback (issue, created_at desc);

alter table attempt_feedback enable row level security;

create policy attempt_feedback_all_own on attempt_feedback
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
