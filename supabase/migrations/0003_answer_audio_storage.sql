-- Storage for recorded answers.
--
-- Audio is private: each user can only touch files under a folder named
-- after their own user id. The bucket is not public, so playback goes
-- through short-lived signed URLs rather than a guessable path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'answers',
  'answers',
  false,
  26214400, -- 25 MB, comfortably more than a 2 minute recording
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
on conflict (id) do nothing;

-- Path convention: answers/<user_id>/<attempt_id>.webm
-- storage.foldername() returns the path segments, so [1] is the user id.

create policy "answers_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'answers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "answers_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'answers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "answers_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'answers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
