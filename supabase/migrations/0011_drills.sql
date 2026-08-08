-- Daily drills.
--
-- A drill is one question and one named move to practise. Short enough
-- to do before a call, and repeatable, which a full session is not.
--
-- The move is the point. "Answer well" is not practisable; "say the
-- number, then stop talking" is. Each drill teaches one, and the
-- feedback is judged against that move rather than in general.

create table drills (
  id          uuid primary key default gen_random_uuid(),
  -- The habit being practised, shown before they answer.
  move        text not null,
  -- One line on why it matters, in the app's voice.
  why         text not null,
  -- The question itself.
  prompt      text not null,
  rubric      rubric_kind not null default 'situational',
  -- Null means it suits any role.
  role_slug   text,
  difficulty  smallint not null default 3 check (difficulty between 1 and 5),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index drills_active_idx on drills (active, role_slug);

-- What each person has already done, so a drill is not repeated until
-- the rest have been seen.
create table drill_runs (
  id         uuid primary key default gen_random_uuid(),
  drill_id   uuid not null references drills(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index drill_runs_user_idx on drill_runs (user_id, created_at desc);

alter table drills enable row level security;
alter table drill_runs enable row level security;

create policy drills_read on drills
  for select to authenticated using (active);

create policy drill_runs_all_own on drill_runs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

insert into drills (move, why, prompt, rubric, role_slug) values
  ('Say the number, then stop talking',
   'Most people name a rate and then keep going, and everything after the number sounds like an apology for it.',
   'A client asks what you charge for a month of social media management. Answer them.',
   'situational', null),

  ('Lead with the result',
   'Beginners describe the process because the process is what they remember. A client is buying the outcome.',
   'Tell me about a piece of work you finished recently. Start with what changed because of it.',
   'star', null),

  ('Acknowledge, then hold',
   'Acknowledging first is what keeps you easy to work with. Holding after it is what keeps the work sustainable. Most people manage one or the other.',
   'A client says your timeline is too slow and asks you to deliver in half the time. Respond.',
   'situational', null),

  ('Decide before you answer',
   'The weak answer is not the one that says yes. It is the one where nothing was weighed, so the client cannot tell what a real limit would sound like.',
   'Your client adds a fifth task to a week already full with four. What do you say?',
   'situational', null),

  ('Ask one question before answering',
   'Answering a vague question with a vague answer wastes the only chance you get. One question makes both specific.',
   'A prospective client says: "We need someone to help with our marketing." Respond.',
   'situational', null),

  ('Give the bad news first',
   'Burying it makes them hunt for it, and everything before it reads as excuses.',
   'You will miss tomorrow''s deadline by two days. The client does not know yet. Tell them.',
   'situational', null),

  ('Say what you do not know',
   'Bluffing survives about one follow-up question. Saying you would check it survives all of them.',
   'A client asks about a tool you have never used. Answer honestly and keep their confidence.',
   'situational', null),

  ('Turn the objection into a question',
   'Defending a price argues with them. Asking what it is being compared to gets you the real objection.',
   'A client says: "That is more than I expected to pay." Respond.',
   'situational', null),

  ('Cut the opening apology',
   'Sorry to bother you, just checking in, hope this is okay. All of it discounts what follows.',
   'You have not been paid for work delivered three weeks ago. Follow up with the client.',
   'situational', null),

  ('One sentence, then stop',
   'Nerves make people restate the same point three ways. The first version was the good one.',
   'Introduce yourself and what you do, as if a client just asked on a call.',
   'situational', null);
