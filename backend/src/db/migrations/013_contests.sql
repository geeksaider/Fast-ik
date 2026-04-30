create table if not exists contests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  required_level_id integer not null references performer_levels(id),
  title text not null,
  brief text not null,
  prize_amount integer not null,
  deadline_at date,
  status text not null default 'open',
  submissions_count integer not null default 0,
  winner_submission_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contests_prize_amount_chk check (prize_amount >= 0)
);

create table if not exists contest_tags (
  contest_id uuid not null references contests(id) on delete cascade,
  tag text not null,
  primary key (contest_id, tag)
);

create table if not exists contest_submissions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  pitch text not null,
  preview_url text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, performer_id),
  constraint contest_submissions_pitch_not_blank_chk check (length(trim(pitch)) > 0)
);

alter table contests
  add constraint contests_winner_submission_id_fkey
  foreign key (winner_submission_id) references contest_submissions(id) on delete set null;

create index if not exists contests_customer_id_idx on contests(customer_id);
create index if not exists contests_category_id_idx on contests(category_id);
create index if not exists contests_required_level_id_idx on contests(required_level_id);
create index if not exists contests_status_idx on contests(status);
create index if not exists contests_deadline_at_idx on contests(deadline_at asc nulls last);
create index if not exists contests_created_at_idx on contests(created_at desc);
create index if not exists contest_tags_tag_idx on contest_tags(tag);
create index if not exists contest_submissions_contest_id_idx on contest_submissions(contest_id);
create index if not exists contest_submissions_performer_id_idx on contest_submissions(performer_id);
create index if not exists contest_submissions_status_idx on contest_submissions(status);
