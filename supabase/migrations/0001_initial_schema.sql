-- Efata initial schema
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- It is written to be idempotent-ish: it will fail loudly if run twice
-- rather than silently duplicating data.

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type user_tier as enum ('free', 'paid');

create type english_level as enum (
  'basic',
  'conversational',
  'professional',
  'fluent'
);

-- experience  = "tell me about a time", scored with STAR
-- hypothetical = "what would you do if", scored on situational judgment
-- technical    = craft knowledge, scored against an answer key
create type question_type as enum ('experience', 'hypothetical', 'technical');

create type rubric_kind as enum ('star', 'situational', 'technical');

-- generated = written by the model from a job post
-- community = submitted by a user after a real interview or client call
-- curated   = written or vetted in-house
create type question_source as enum ('generated', 'community', 'curated');

create type review_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------

create table roles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  label       text not null,
  description text,
  created_at  timestamptz not null default now()
);

insert into roles (slug, label, description) values
  ('admin-va',        'General admin VA',        'Inbox, calendar, data entry, research, and day-to-day client support.'),
  ('social-media',    'Social media manager',    'Content calendars, scheduling, community management, and reporting.'),
  ('customer-support','Customer support / CSR',  'Tickets, live chat, phone support, and escalation handling.'),
  ('bookkeeping',     'Bookkeeper / accounting VA', 'Reconciliation, invoicing, payables and receivables, month-end.'),
  ('web-dev',         'Web developer',           'Site builds, maintenance, integrations, and troubleshooting.');

-- ---------------------------------------------------------------------
-- Profiles (one row per auth user)
-- ---------------------------------------------------------------------

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  primary_role_id uuid references roles(id) on delete set null,
  english_level   english_level not null default 'conversational',
  tier            user_tier not null default 'free',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------

create table questions (
  id           uuid primary key default gen_random_uuid(),
  role_id      uuid references roles(id) on delete set null,
  type         question_type not null,
  rubric       rubric_kind not null,
  body         text not null,
  context      text,
  difficulty   smallint not null default 3 check (difficulty between 1 and 5),
  tier         user_tier not null default 'free',
  source       question_source not null default 'generated',
  status       review_status not null default 'pending',
  -- Set when source = 'community'. Nulled if the submitter deletes
  -- their account, so an approved question survives.
  submitted_by uuid references auth.users(id) on delete set null,
  times_asked  integer not null default 0,
  created_at   timestamptz not null default now()
);

create index questions_role_status_idx
  on questions (role_id, status, tier);

create index questions_type_idx on questions (type);

-- Answer keys live in their own table because they must never reach the
-- browser. Evaluation reads them server-side with the service role key.
-- No RLS policy is defined below, so the anon key cannot read this at all.
create table question_answer_keys (
  question_id uuid primary key references questions(id) on delete cascade,
  -- e.g. {"must_mention": [...], "red_flags": [...], "strong_answer": "..."}
  markers     jsonb not null,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Practice sessions
-- ---------------------------------------------------------------------

create table sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  role_id      uuid references roles(id) on delete set null,
  -- The pasted job post or client brief this session was built from.
  job_post     text,
  title        text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index sessions_user_idx on sessions (user_id, created_at desc);

create table session_questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position    smallint not null,
  unique (session_id, position)
);

create index session_questions_session_idx on session_questions (session_id);

-- ---------------------------------------------------------------------
-- Attempts
--
-- attempt_number is what makes the retry loop work: attempt 1 and
-- attempt 2 on the same question can be diffed and shown side by side.
-- ---------------------------------------------------------------------

create table attempts (
  id                  uuid primary key default gen_random_uuid(),
  session_question_id uuid not null references session_questions(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  attempt_number      smallint not null default 1,
  -- Path in Supabase Storage, not a public URL.
  audio_path          text,
  transcript          text,
  -- Rubric scores plus the delivery layer, shape varies by rubric.
  scores              jsonb,
  feedback            text,
  -- Rewritten version of the user's own answer, for the "hear it better"
  -- feature. Stored so it can be replayed without re-generating.
  improved_answer     text,
  improved_audio_path text,
  created_at          timestamptz not null default now(),
  unique (session_question_id, attempt_number)
);

create index attempts_user_idx on attempts (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Row level security
--
-- The publishable key ships to the browser, so anyone can query these
-- tables directly with the JS client. Every rule below is therefore a
-- real access control boundary, not a convenience.
-- ---------------------------------------------------------------------

alter table roles                enable row level security;
alter table profiles             enable row level security;
alter table questions            enable row level security;
alter table question_answer_keys enable row level security;
alter table sessions             enable row level security;
alter table session_questions    enable row level security;
alter table attempts             enable row level security;

-- Roles: readable by anyone signed in.
create policy roles_read on roles
  for select to authenticated using (true);

-- Profiles: you can only see and edit your own.
create policy profiles_read_own on profiles
  for select to authenticated using (id = (select auth.uid()));

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- RLS decides which ROWS you may update, not which COLUMNS. Without the
-- next two statements a signed-in user could run
--   supabase.from('profiles').update({ tier: 'paid' })
-- from the browser console and unlock the entire paid question bank.
-- Column grants close that off: tier is not in the list.
revoke update on profiles from authenticated;
grant update (display_name, primary_role_id, english_level)
  on profiles to authenticated;

-- Second line of defence, in case a later migration re-grants the table.
-- Billing code runs as service_role and is unaffected.
-- Deliberately NOT security definer: inside a definer function
-- current_user resolves to the function owner, so the role check below
-- would never match and the guard would silently do nothing.
create function guard_profile_tier()
returns trigger
language plpgsql
as $$
begin
  if new.tier is distinct from old.tier
     and current_user in ('authenticated', 'anon') then
    raise exception 'tier cannot be changed by the account holder';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_tier
  before update on profiles
  for each row execute function guard_profile_tier();

-- Questions: approved questions only, and paid questions only for paid
-- users. Free users can still see their own pending submissions.
create policy questions_read on questions
  for select to authenticated using (
    (
      status = 'approved'
      and (
        tier = 'free'
        or exists (
          select 1 from profiles p
          where p.id = (select auth.uid()) and p.tier = 'paid'
        )
      )
    )
    or submitted_by = (select auth.uid())
  );

-- Users can submit real questions they were asked. They land as
-- 'pending' and 'community' regardless of what the client sends.
create policy questions_insert_community on questions
  for insert to authenticated with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and source = 'community'
  );

-- question_answer_keys: no policy at all. Unreachable with the
-- publishable key. Server-side evaluation uses the service role.

-- Sessions and everything hanging off them: owner only.
create policy sessions_all_own on sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy session_questions_all_own on session_questions
  for all to authenticated
  using (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy attempts_all_own on attempts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
