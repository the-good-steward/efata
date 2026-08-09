alter table profiles add column guide_seen_at timestamptz;
grant update (guide_seen_at) on profiles to authenticated;
