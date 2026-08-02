-- More roles, and technical focus moved out of the prompt.
--
-- The per-role territory used to live in the generation prompt, which
-- meant adding a role required a code change and a deploy. Storing it
-- here makes a new role a single row, and keeps the prompt from growing
-- unboundedly as the role list does.

alter table roles add column technical_focus text;

update roles set technical_focus = 'inbox triage systems and what gets touched first; calendar conflicts across time zones; building an SOP someone else can follow; catching a double booking before the client sees it; deciding what to escalate versus handle' where slug = 'admin-va';

update roles set technical_focus = 'organic reach dropping and what changes first; engagement rate versus follower count and which matters to a client; hooks and the first three seconds; posting cadence and format mix; reading analytics to decide what to make next; why a post that performed last month flops now' where slug = 'social-media';

update roles set technical_focus = 'cutting first response time without dropping quality; when a macro helps and when it makes things worse; triage order when the queue is deep; the refund or exception the policy does not cover; turning an angry ticket around' where slug = 'customer-support';

update roles set technical_focus = 'a reconciliation that will not balance and where to look first; chasing receivables without damaging the relationship; month-end close order; miscategorised transactions found late; what the client''s P&L is actually telling them' where slug = 'bookkeeping';

update roles set technical_focus = 'a page that loads slowly and what you measure first; forms silently not sending; a plugin or theme update that broke the site; staging and backups before a risky change; what you check before telling a client it is fixed' where slug = 'web-dev';

insert into roles (slug, label, description, technical_focus) values
  ('software-dev',
   'Software developer',
   'Building and maintaining applications, APIs, and integrations.',
   'debugging something that only fails in production; deciding what to test and what to skip under deadline; reading an unfamiliar codebase before changing it; handling a breaking dependency upgrade; explaining a technical tradeoff to a non-technical client'),

  ('medical-va',
   'Medical VA',
   'Patient scheduling, records, insurance, and clinic admin support.',
   'protecting patient information and what you never put in an email or chat; handling an insurance denial or prior authorisation; triaging an urgent patient message you are not licensed to answer; scheduling around a provider running late; catching an error in a chart entry'),

  ('executive-assistant',
   'Executive assistant',
   'Supporting a founder or executive: calendar, travel, inbox, follow-through.',
   'protecting an executive''s calendar and what you decline on their behalf; deciding what reaches them and what you handle; travel that falls apart mid-trip; chasing people more senior than you; keeping commitments from slipping through'),

  ('ecommerce-va',
   'E-commerce VA',
   'Shopify or Amazon stores: listings, orders, inventory, customer messages.',
   'a listing that stopped converting and what you check first; stock about to run out during a promotion; a wave of refund requests after a bad batch; product copy and images that affect ranking; reconciling orders against payouts'),

  ('real-estate-va',
   'Real estate VA',
   'Listings, lead follow-up, transaction coordination, and CRM upkeep.',
   'chasing a lead who went quiet without being a nuisance; keeping a transaction moving when a deadline is at risk; listing details that must never be wrong; CRM hygiene and what happens when it rots; coordinating people who all blame each other'),

  ('lead-gen',
   'Lead generation / appointment setter',
   'Prospecting, cold outreach, qualifying, and booking calls.',
   'a cold sequence with opens but no replies and what you change; qualifying someone out early rather than wasting a call; personalising at volume without it sounding automated; handling the first objection on a live call; measuring whether outreach is actually working'),

  ('content-writer',
   'Content writer / copywriter',
   'Blog posts, landing pages, emails, and marketing copy.',
   'a page with traffic but no conversions and what you rewrite first; matching a brand voice you did not create; structuring long copy so it gets read; a client who wants it longer when it should be shorter; knowing what a piece is actually meant to achieve'),

  ('seo-specialist',
   'SEO specialist',
   'Search visibility: keywords, content strategy, and technical fixes.',
   'rankings dropping with no site changes and what you check first; a keyword a client cannot realistically win and how you tell them; the technical issues that quietly cost the most; internal linking decisions; what you report when results take months'),

  ('paid-ads',
   'Paid ads / media buyer',
   'Meta and Google campaigns: setup, testing, scaling, and reporting.',
   'cost per acquisition doubling overnight with nothing changed and where you look first; when to kill a test versus let it run; creative fatigue and how you spot it; budget shifts between campaigns and the reasoning; what you tell a client in a bad week'),

  ('video-editor',
   'Video editor',
   'Short-form and long-form editing, captions, and repurposing.',
   'the first three seconds and why a video loses people; cutting long footage into short clips that still make sense; captions, pacing, and platform differences; a client who wants every take kept; managing large files and revisions without chaos'),

  ('graphic-designer',
   'Graphic designer',
   'Brand assets, social graphics, presentations, and marketing collateral.',
   'working inside a brand guideline you disagree with; a design that looks fine but does not perform; file formats and where things break; handling vague feedback like "make it pop"; designing for a phone screen first'),

  ('data-research',
   'Data entry / research VA',
   'List building, data cleanup, and research support.',
   'finding an error in a dataset you did not create; verifying a source before you trust it; keeping accuracy up on repetitive work; deciding when data is good enough to hand over; building a list without collecting things you should not')
on conflict (slug) do nothing;
