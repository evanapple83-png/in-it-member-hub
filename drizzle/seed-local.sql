-- Synthetic local-only identities. Re-running preserves edits to existing demo content.
insert into members (user_id, full_name, email, headline, role, company, location,
  about, skills, languages, visibility_status, consent_given, onboarding_completed)
values ('local-dev-admin', 'Local Admin', 'admin@example.test', 'Local community coordinator',
  'Coordinator', 'IN-IT Demo', 'Amsterdam', 'Synthetic administrator for local development.',
  array['Community building','TypeScript'], array['Dutch','English'], 'approved', true, true),
  ('local-dev-pending', 'Pending Demo', 'pending-dev@example.test', 'Awaiting coordinator approval',
  'Developer', 'Demo Company', 'Rotterdam', 'Synthetic member waiting for approval.',
  array['React'], array['English'], 'pending', true, true)
on conflict (email) do nothing;

update members set user_id = 'local-dev-member' where email = 'amina.hassan@example.test' and user_id is null;

insert into admins (user_id, role)
select 'local-dev-admin', 'admin'
where not exists (select 1 from admins where user_id = 'local-dev-admin');

insert into community_memberships (community_id, member_id)
select c.id, m.id from communities c cross join members m
where c.slug = 'engineers' and m.email in ('admin@example.test', 'amina.hassan@example.test')
on conflict (community_id, member_id) do nothing;

insert into events (slug, title, description, location, starts_at, ends_at, category, status)
values ('local-demo-tech-talk', 'Demo: Cloud & AI meetup', 'Synthetic event for local development.',
  'Amsterdam (demo)', now() + interval '7 days', now() + interval '7 days 2 hours', 'kennis', 'published'),
  ('local-demo-social', 'Demo: Community coffee', 'Meet the demo community.',
  'Utrecht (demo)', now() + interval '14 days', now() + interval '14 days 1 hour', 'social', 'published')
on conflict (slug) do nothing;

insert into event_rsvps (event_id, member_id, status)
select e.id, m.id, 'going' from events e cross join members m
where e.slug = 'local-demo-tech-talk' and m.email = 'amina.hassan@example.test'
on conflict (event_id, member_id) do nothing;

insert into community_posts (id, community_id, author_member_id, body)
select '10000000-0000-4000-8000-000000000001', c.id, m.id,
  'Welkom in de demo! Waar werk jij deze week aan?'
from communities c cross join members m
where c.slug = 'engineers' and m.email = 'amina.hassan@example.test'
on conflict (id) do nothing;

insert into blog_posts (slug, title, body, author_member_id, showcased_at)
select 'local-demo-welcome', 'Welkom bij de lokale IN-IT demo',
  'Dit is een fictief verhaal voor lokale ontwikkeling. Deel hier je ervaringen met de community.',
  id, now() from members where email = 'amina.hassan@example.test'
on conflict (slug) do nothing;

insert into comments (id, target_type, target_id, author_member_id, body)
select '10000000-0000-4000-8000-000000000002', 'blog_post', b.id, m.id, 'Welkom! Dit is een demoreactie.'
from blog_posts b cross join members m
where b.slug = 'local-demo-welcome' and m.email = 'admin@example.test'
on conflict (id) do nothing;

insert into access_requests (id, full_name, email, motivation)
values ('10000000-0000-4000-8000-000000000003', 'Demo Applicant', 'applicant@example.test',
  'Synthetic access request for testing the admin review flow.')
on conflict (id) do nothing;
