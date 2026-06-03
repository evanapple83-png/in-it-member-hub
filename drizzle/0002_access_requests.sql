-- Phase 0/1: profieluitbreidingen + digitale toegangsaanvraag (FRD FR-004/005/006/019/020/021)

-- Member profile extensions
alter table members add column if not exists member_type text not null default 'member';
alter table members add column if not exists public_fields text[] not null default '{}'::text[];
alter table members add column if not exists email_opt_out boolean not null default false;

-- Digitale toegangsaanvraag: registreert en bewaart elke aanvraag (zelf of voorgedragen vriend),
-- vervangt het ongeregistreerde telefonische proces en geeft de coordinator een audittrail.
create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  requester_type text not null default 'member' check (requester_type in ('member','friend')),
  motivation text,
  linkedin_url text,
  proposed_by_member_id uuid references members(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','approved','rejected')),
  review_note text,
  reviewed_by_admin_id uuid references admins(id) on delete set null,
  reviewed_at timestamp with time zone,
  invite_id uuid references invites(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists access_requests_status_idx on access_requests (status, created_at);

drop trigger if exists set_access_requests_updated_at on access_requests;
create trigger set_access_requests_updated_at
before update on access_requests
for each row execute function set_updated_at();
