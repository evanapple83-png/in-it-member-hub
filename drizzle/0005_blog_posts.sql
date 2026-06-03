-- Phase 6: ledenblog + "Showcase van de week" (extra-wens van Evan, besloten/login-only)

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  cover_image_url text,
  author_member_id uuid references members(id) on delete set null,
  status text not null default 'published' check (status in ('published','hidden')),
  -- Beheerder markeert een post; de meest recent gemarkeerde gepubliceerde post = Showcase van de week
  showcased_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists blog_posts_status_created_idx on blog_posts (status, created_at);

drop trigger if exists set_blog_posts_updated_at on blog_posts;
create trigger set_blog_posts_updated_at
before update on blog_posts
for each row execute function set_updated_at();
