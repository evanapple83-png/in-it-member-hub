create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  full_name text not null,
  email text not null unique,
  linkedin_url text,
  photo_url text,
  headline text,
  role text,
  company text,
  location text,
  about text,
  skills text[] not null default '{}',
  can_help_with text[] not null default '{}',
  looking_for text[] not null default '{}',
  languages text[] not null default '{}',
  open_to_mentor boolean not null default false,
  open_to_opportunities boolean not null default false,
  open_to_collaborate boolean not null default false,
  open_to_speaking boolean not null default false,
  visibility_status text not null default 'pending' check (visibility_status in ('pending','approved','hidden','rejected')),
  consent_given boolean not null default false,
  onboarding_completed boolean not null default false,
  auth_provider text not null default 'linkedin',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists linkedin_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  member_id uuid references members(id) on delete set null,
  linkedin_sub text not null unique,
  linkedin_email text,
  linkedin_name text,
  linkedin_picture text,
  provider text not null default 'linkedin',
  connected_at timestamp with time zone not null default now(),
  last_synced_at timestamp with time zone not null default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role text not null default 'admin',
  created_at timestamp with time zone not null default now()
);

create index if not exists members_public_visibility_idx on members (visibility_status, consent_given, created_at desc);
create index if not exists members_user_id_idx on members (user_id);
create index if not exists linkedin_accounts_user_id_idx on linkedin_accounts (user_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_members_updated_at on members;
create trigger set_members_updated_at
before update on members
for each row execute function set_updated_at();
