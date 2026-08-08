-- The CV.
--
-- Stored so questions can be anchored to what someone has actually
-- done, and so feedback can point back at experience they left out of
-- an answer.
--
-- The summary is structured rather than raw text: it is read once at
-- upload and reused on every question and every evaluation, so it has
-- to be small enough to sit in a prompt without cost.
--
-- Contact details are deliberately not extracted. The app has no use
-- for a phone number or an address, and not holding them is simpler
-- than protecting them.

create table cv_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  -- Path in the private 'cvs' bucket. Null once a person removes it.
  file_path   text,
  -- What was read: roles, tools, years, notable results.
  summary     jsonb not null default '{}'::jsonb,
  -- They confirm or correct the summary before it is used anywhere.
  confirmed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table cv_profiles enable row level security;

create policy cv_profiles_own on cv_profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Asked once. Set whether they upload or skip, so nobody is asked
-- twice.
alter table profiles add column cv_asked_at timestamptz;

grant update (cv_asked_at) on profiles to authenticated;

-- Private bucket, per-user folders, same shape as the answers bucket.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "cv owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'cvs' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "cv owner write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cvs' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "cv owner replace" on storage.objects
  for update to authenticated
  using (bucket_id = 'cvs' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "cv owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cvs' and (select auth.uid())::text = (storage.foldername(name))[1]);
