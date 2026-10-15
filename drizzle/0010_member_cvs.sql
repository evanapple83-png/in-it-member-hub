create table if not exists member_cvs (
  member_id uuid primary key references members(id) on delete cascade,
  storage_provider text not null check (storage_provider in ('local', 'blob')),
  storage_key text not null,
  filename text not null,
  size integer not null check (size > 0 and size <= 4194304),
  uploaded_at timestamp with time zone not null default now()
);
