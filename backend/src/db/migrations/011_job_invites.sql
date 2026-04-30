create table if not exists job_invites (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  customer_id uuid not null references users(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_invites_status_chk check (status in ('pending', 'accepted', 'declined')),
  constraint job_invites_message_chk check (length(trim(message)) >= 10),
  constraint job_invites_not_self_chk check (customer_id <> performer_id),
  unique (job_id, performer_id)
);

create index if not exists job_invites_job_id_idx on job_invites(job_id);
create index if not exists job_invites_customer_id_created_at_idx
  on job_invites(customer_id, created_at desc);
create index if not exists job_invites_performer_id_created_at_idx
  on job_invites(performer_id, created_at desc);
create index if not exists job_invites_status_idx on job_invites(status);
