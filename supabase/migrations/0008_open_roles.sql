-- Open the app to any role, not just the ones we have listed.
--
-- The catalogue is useful as a hint — it gives the generator real
-- territory to draw technical questions from — but it should never be
-- the reason someone cannot practise. A pharmacy tech VA, a legal
-- transcriptionist, or a drone survey operator all deserve questions,
-- and none of them are on the list.
--
-- 'other' is the escape hatch: when nothing fits, the technical
-- territory is derived from the job post itself.

insert into roles (slug, label, description, technical_focus) values
  ('other',
   'Something else',
   'Any role not listed. Questions are built from the job post itself.',
   'derive the technical territory from the job post directly: the tools it names, the metrics it cares about, the outputs it asks for, and the judgment calls that role has to make daily')
on conflict (slug) do nothing;

-- What they actually call their work, when it is not on the list.
-- Free text on purpose: the point is to stop forcing people into
-- categories we happened to think of.
alter table profiles add column custom_role text;

grant update (custom_role) on profiles to authenticated;
