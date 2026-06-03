-- Phase 5: posts feed inside community rooms

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  author_member_id uuid references members(id) on delete set null,
  body text not null,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists community_posts_community_idx on community_posts (community_id, created_at);

drop trigger if exists set_community_posts_updated_at on community_posts;
create trigger set_community_posts_updated_at
before update on community_posts
for each row execute function set_updated_at();
