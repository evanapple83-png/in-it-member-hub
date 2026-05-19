create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  email text,
  note text,
  status text not null default 'active' check (status in ('active','used','expired','revoked')),
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  used_by_user_id text,
  created_by_admin_id uuid references admins(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null default 'professional',
  is_private boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists community_memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  role text not null default 'member',
  contribution_score integer not null default 0,
  joined_at timestamp with time zone not null default now(),
  unique (community_id, member_id)
);

create index if not exists invites_status_expires_idx on invites (status, expires_at);
create index if not exists invites_used_by_user_id_idx on invites (used_by_user_id);
create index if not exists community_memberships_member_id_idx on community_memberships (member_id);

drop trigger if exists set_invites_updated_at on invites;
create trigger set_invites_updated_at
before update on invites
for each row execute function set_updated_at();

drop trigger if exists set_communities_updated_at on communities;
create trigger set_communities_updated_at
before update on communities
for each row execute function set_updated_at();

insert into communities (slug, name, description, category)
values
  ('security-specialists', 'Security specialists', 'Cybersecurity, risk, compliance and secure engineering across the community.', 'professional'),
  ('engineers', 'Engineers', 'Software, data, cloud and platform builders sharing practical expertise.', 'professional'),
  ('product-design', 'Product & design', 'Product managers, UX designers and makers shaping better digital products.', 'professional'),
  ('football', 'Football', 'A lighter social space for members who connect around football.', 'social')
on conflict (slug) do nothing;
