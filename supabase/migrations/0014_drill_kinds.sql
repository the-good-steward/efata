-- Two kinds of drill.
--
-- The seeded ones teach a communication habit and suit anyone: say the
-- number and stop, cut the opening apology. Those stay as they are.
--
-- Field drills are different in kind. They test whether someone can
-- explain something in their own work clearly, which is a real weakness
-- and not the same exercise. Keeping them apart means a person can
-- choose what they are practising rather than getting whichever came up.

alter table drills add column kind text not null default 'habit'
  check (kind in ('habit', 'field'));

create index drills_kind_role_idx on drills (kind, role_slug, active);

-- Field drills, keyed to the role someone chose at signup. 'move' holds
-- the topic rather than a habit, since there is no habit being taught.
insert into drills (kind, move, why, prompt, rubric, role_slug) values
  ('field', 'Explaining a reconciliation problem',
   'Numbers that do not match are the moment a client most needs plain language, and most often gets jargon.',
   'Your client asks why last month''s bank balance does not match the books. Explain it to them.',
   'technical', 'bookkeeping'),

  ('field', 'Handling a records discrepancy',
   'Getting this wrong in a medical setting is not just embarrassing. Clarity and care have to arrive together.',
   'A patient record does not match the referral you were sent. Explain the problem to the practice manager and what you would do.',
   'technical', 'medical-va'),

  ('field', 'Reporting on a campaign that underperformed',
   'The temptation is to lead with what went well. A client wants to know what happened and what changes.',
   'Last month''s posts got half the reach of the month before. Report it to the client.',
   'technical', 'social-media'),

  ('field', 'Justifying ad spend',
   'Being asked where the money went is not an accusation, but it sounds like one, and most people get defensive rather than clear.',
   'Your client asks what they got for last month''s ad budget. Answer them.',
   'technical', 'paid-ads'),

  ('field', 'Explaining why the traffic dropped',
   'Ranking changes have a hundred causes and clients hear excuses. Say what you know and what you do not.',
   'A client''s search traffic fell last month and they want to know why. Tell them.',
   'technical', 'seo-specialist'),

  ('field', 'Pushing back on a design request',
   'The client is not wrong to ask. The skill is explaining why it will not work without sounding precious about it.',
   'A client asks you to make their logo bigger and add three more colours. Respond.',
   'technical', 'graphic-designer'),

  ('field', 'Explaining a delay in the build',
   'Technical delays sound like excuses to someone who cannot see the work. Say what happened in their terms.',
   'The feature you promised for Friday needs another week. Tell the client why.',
   'technical', 'web-dev'),

  ('field', 'Reporting on a lead list that did not convert',
   'A quiet month is the conversation that decides whether they keep you. Bring the numbers, not the apology.',
   'You sent 200 leads last month and three converted. The client asks what happened.',
   'technical', 'lead-gen'),

  ('field', 'Explaining a schedule conflict',
   'An executive assistant is judged on how a problem is presented, not only on whether it is solved.',
   'Two of the people you support have booked the same slot with the same client. Explain it and what you propose.',
   'technical', 'executive-assistant'),

  ('field', 'Explaining why an order went wrong',
   'A customer wants to know what happened and what you are doing, in that order, without being managed.',
   'A customer''s order shipped to the wrong address. Tell them.',
   'technical', 'ecommerce-va');
