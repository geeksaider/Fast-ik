create extension if not exists pgcrypto;

create table if not exists roles (
  id serial primary key,
  code text not null unique,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  display_name text not null,
  role_id integer not null references roles(id),
  status text not null default 'active',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists performer_levels (
  id serial primary key,
  code text not null unique,
  title text not null,
  required_xp integer not null default 0,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists performer_progress (
  user_id uuid primary key references users(id) on delete cascade,
  level_id integer not null references performer_levels(id),
  xp integer not null default 0,
  completed_orders integer not null default 0,
  rating numeric(3, 2),
  interview_required boolean not null default false,
  interview_passed boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists users_role_id_idx on users(role_id);
create index if not exists categories_is_active_idx on categories(is_active);
create index if not exists performer_progress_level_id_idx on performer_progress(level_id);
