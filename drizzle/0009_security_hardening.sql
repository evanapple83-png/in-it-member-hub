-- Security hardening (audit 30 sep 2026).
-- 1. One member row per LinkedIn account: a second row let a rejected or deactivated user
--    slip back in as 'pending'. Partial index, so CSV-imported rows without a user stay allowed.
--    Check first:  select user_id, count(*) from members where user_id is not null group by 1 having count(*) > 1;
create unique index if not exists members_user_id_key on members (user_id) where user_id is not null;

-- 2. Fixed-window rate limits for public and write endpoints (invite codes, access requests,
--    comments, posts, uploads). One row per bucket key; old rows are harmless and tiny.
create table if not exists rate_limits (
  key text primary key,
  window_start timestamp with time zone not null default now(),
  count integer not null default 0
);
