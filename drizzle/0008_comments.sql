-- Reacties onder verhalen (blog_posts) en groepsberichten (community_posts).
-- Polymorf doel (target_type + target_id): een FK kan niet cascaden, dus de triggers
-- onderaan ruimen reacties op zodra hun verhaal of bericht wordt verwijderd. Ze vuren ook
-- bij de cascade community -> community_posts, dus een verwijderde groep laat niets achter.

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('blog_post','community_post')),
  target_id uuid not null,
  author_member_id uuid references members(id) on delete set null,
  body text not null,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists comments_target_idx on comments (target_type, target_id, created_at);

drop trigger if exists set_comments_updated_at on comments;
create trigger set_comments_updated_at
before update on comments
for each row execute function set_updated_at();

create or replace function delete_blog_post_comments()
returns trigger as $$
begin
  delete from comments where target_type = 'blog_post' and target_id = old.id;
  return old;
end;
$$ language plpgsql;

drop trigger if exists delete_blog_post_comments on blog_posts;
create trigger delete_blog_post_comments
after delete on blog_posts
for each row execute function delete_blog_post_comments();

create or replace function delete_community_post_comments()
returns trigger as $$
begin
  delete from comments where target_type = 'community_post' and target_id = old.id;
  return old;
end;
$$ language plpgsql;

drop trigger if exists delete_community_post_comments on community_posts;
create trigger delete_community_post_comments
after delete on community_posts
for each row execute function delete_community_post_comments();
