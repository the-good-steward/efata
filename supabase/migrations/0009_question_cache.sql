-- Cache generated question sets.
--
-- The single biggest cost lever in the app. Generation runs several web
-- searches and returns a large amount of input tokens, and it is by far
-- the most expensive call Efata makes. Without this, ten people pasting
-- the same OnlineJobs.ph listing is ten full generations billed.
--
-- Job posts repeat far more than you would expect: the same listing is
-- cross-posted, agencies reuse templates, and a cohort practising
-- together will paste the same role. Keyed on the normalised post plus
-- the levels that change the output, one generation serves all of them.
--
-- No RLS policy is defined on purpose. This table holds no user data
-- and is written only by the server with the service role, which also
-- means a client cannot poison the cache with a crafted payload.

create table question_set_cache (
  cache_key   text primary key,
  payload     jsonb not null,
  hits        integer not null default 0,
  created_at  timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index question_set_cache_used_idx on question_set_cache (last_used_at);

alter table question_set_cache enable row level security;

-- Count a cache hit without a read-modify-write round trip.
create function bump_cache_hit(key text)
returns void
language sql
security definer
set search_path = public
as $$
  update question_set_cache
     set hits = hits + 1, last_used_at = now()
   where cache_key = key;
$$;
