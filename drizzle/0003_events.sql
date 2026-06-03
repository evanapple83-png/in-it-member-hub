-- Phase 4: activiteitenagenda (FRD FR-023..026)

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  location text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  category text not null default 'community',
  meet_link text,
  calendar_link text,
  google_event_id text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  audience text not null default 'all',
  created_by_admin_id uuid references admins(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'going' check (status in ('going','maybe','declined')),
  created_at timestamp with time zone not null default now(),
  unique (event_id, member_id)
);

create index if not exists events_status_starts_idx on events (status, starts_at);
create index if not exists event_rsvps_event_idx on event_rsvps (event_id);

drop trigger if exists set_events_updated_at on events;
create trigger set_events_updated_at
before update on events
for each row execute function set_updated_at();
