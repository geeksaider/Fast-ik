alter table users
  add column if not exists last_login_at timestamptz;

create table if not exists auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  event_type text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists users_status_idx on users(status);
create index if not exists auth_events_user_id_idx on auth_events(user_id);
create index if not exists auth_events_event_type_idx on auth_events(event_type);
