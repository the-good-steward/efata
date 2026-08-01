-- Seed two users: one free, one paid
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'free@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'paid@test.com');

update profiles set tier = 'paid' where id = '22222222-2222-2222-2222-222222222222';

-- Seed questions: one free approved, one paid approved, one pending
insert into questions (role_id, type, rubric, body, tier, status, source)
select id, 'hypothetical', 'situational', 'FREE-Q', 'free', 'approved', 'curated' from roles where slug='admin-va';
insert into questions (role_id, type, rubric, body, tier, status, source)
select id, 'technical', 'technical', 'PAID-Q', 'paid', 'approved', 'curated' from roles where slug='admin-va';
insert into questions (role_id, type, rubric, body, tier, status, source)
select id, 'technical', 'technical', 'PENDING-Q', 'free', 'pending', 'curated' from roles where slug='admin-va';

insert into question_answer_keys (question_id, markers)
select id, '{"must_mention":["secret"]}'::jsonb from questions where body='PAID-Q';

grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;
