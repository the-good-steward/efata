-- Experience level, captured at signup.
--
-- Distinct from english_level on purpose. Someone can be fluent in
-- English and new to bookkeeping, or highly experienced in support work
-- and hesitant in English. Collapsing the two would mean a capable
-- specialist gets baby questions because their English is careful, or a
-- beginner gets senior questions because they speak smoothly.
--
-- english_level tunes how questions are WORDED.
-- experience_level tunes how HARD they are.

create type experience_level as enum ('beginner', 'intermediate', 'expert');

alter table profiles
  add column experience_level experience_level not null default 'beginner',
  -- Set once onboarding is completed, so we know whether to show it.
  add column onboarded_at timestamptz;

-- Users need to be able to set these themselves during onboarding.
-- Column grants are explicit here because the initial migration
-- deliberately revoked blanket update on profiles to stop tier
-- escalation, so new columns are not writable by default.
grant update (experience_level, onboarded_at) on profiles to authenticated;
