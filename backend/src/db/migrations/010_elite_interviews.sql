create table if not exists performer_interviews (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid not null references users(id) on delete cascade,
  reviewer_id uuid references users(id) on delete set null,
  status text not null,
  note text not null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint performer_interviews_status_chk check (status in ('passed', 'failed')),
  constraint performer_interviews_note_chk check (length(trim(note)) >= 10)
);

create index if not exists performer_interviews_performer_id_created_at_idx
  on performer_interviews(performer_id, created_at desc);
create index if not exists performer_interviews_reviewer_id_idx on performer_interviews(reviewer_id);
create index if not exists performer_interviews_status_idx on performer_interviews(status);
