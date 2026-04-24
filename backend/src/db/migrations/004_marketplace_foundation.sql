create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text not null,
  budget_min integer,
  budget_max integer,
  deadline_at date,
  status text not null default 'published',
  moderation_status text not null default 'pending',
  applications_count integer not null default 0,
  selected_application_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_budget_order_chk check (
    budget_min is null or budget_max is null or budget_min <= budget_max
  )
);

create table if not exists job_tags (
  job_id uuid not null references jobs(id) on delete cascade,
  tag text not null,
  primary key (job_id, tag)
);

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  cover_letter text not null,
  price integer,
  delivery_days integer,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, performer_id)
);

alter table jobs
  add constraint jobs_selected_application_id_fkey
  foreign key (selected_application_id) references job_applications(id) on delete set null;

create index if not exists jobs_customer_id_idx on jobs(customer_id);
create index if not exists jobs_category_id_idx on jobs(category_id);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists jobs_moderation_status_idx on jobs(moderation_status);
create index if not exists jobs_created_at_idx on jobs(created_at desc);
create index if not exists job_tags_tag_idx on job_tags(tag);
create index if not exists job_applications_job_id_idx on job_applications(job_id);
create index if not exists job_applications_performer_id_idx on job_applications(performer_id);
create index if not exists job_applications_status_idx on job_applications(status);
