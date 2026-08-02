-- Calibration: your own score for an answer, recorded before you see
-- Efata's.
--
-- The order matters. Scoring after seeing the machine's number is
-- anchoring, not calibration, and would produce agreement that means
-- nothing. The page enforces this by hiding Efata's score until yours
-- is saved, and the unique constraint stops a score being revised after
-- the reveal.

create table calibrations (
  id               uuid primary key default gen_random_uuid(),
  attempt_id       uuid not null references attempts(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  human_substance  smallint not null check (human_substance between 1 and 5),
  human_delivery   smallint not null check (human_delivery between 1 and 5),
  note             text,
  created_at       timestamptz not null default now(),
  unique (attempt_id, user_id)
);

create index calibrations_user_idx on calibrations (user_id, created_at desc);

alter table calibrations enable row level security;

create policy calibrations_all_own on calibrations
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
