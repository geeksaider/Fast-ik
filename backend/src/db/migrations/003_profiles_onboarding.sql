create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  bio text,
  city text,
  avatar_url text,
  website_url text,
  telegram text,
  preferred_language text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  company_name text,
  company_site text,
  company_description text,
  project_budget_min integer,
  project_budget_max integer,
  moderation_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists performer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  headline text,
  hourly_rate integer,
  availability text not null default 'part_time',
  experience_years integer,
  specialization text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists user_skills (
  user_id uuid not null references users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  level text not null default 'middle',
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  project_url text,
  cover_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skills_category_id_idx on skills(category_id);
create index if not exists user_skills_skill_id_idx on user_skills(skill_id);
create index if not exists portfolio_items_user_id_idx on portfolio_items(user_id);
