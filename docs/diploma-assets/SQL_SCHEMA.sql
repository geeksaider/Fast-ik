-- Fastik SQL schema generated from backend/src/db/migrations
-- Order follows migration file names.


-- ============================================================
-- backend/src/db/migrations/001_core_foundation.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/002_auth_flow.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/003_profiles_onboarding.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/004_marketplace_foundation.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/005_orders_escrow.sql
-- ============================================================

create table if not exists wallets (
  user_id uuid primary key references users(id) on delete cascade,
  available_balance integer not null default 0,
  held_balance integer not null default 0,
  currency text not null default 'RUB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_non_negative_chk check (available_balance >= 0 and held_balance >= 0)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id) on delete cascade,
  application_id uuid not null unique references job_applications(id) on delete restrict,
  customer_id uuid not null references users(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  title text not null,
  amount integer not null default 0,
  status text not null default 'in_progress',
  work_result text,
  submitted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  disputed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amount_non_negative_chk check (amount >= 0)
);

create table if not exists escrow_holds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  application_id uuid not null references job_applications(id) on delete restrict,
  customer_id uuid not null references users(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  status text not null default 'held',
  held_at timestamptz not null default now(),
  released_at timestamptz,
  refunded_at timestamptz,
  disputed_at timestamptz,
  constraint escrow_holds_amount_non_negative_chk check (amount >= 0)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  escrow_hold_id uuid references escrow_holds(id) on delete set null,
  type text not null,
  direction text not null,
  amount integer not null,
  balance_after integer not null,
  description text not null,
  created_at timestamptz not null default now(),
  constraint transactions_amount_non_negative_chk check (amount >= 0)
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  actor_id uuid references users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists orders_performer_id_idx on orders(performer_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists escrow_holds_customer_id_idx on escrow_holds(customer_id);
create index if not exists escrow_holds_performer_id_idx on escrow_holds(performer_id);
create index if not exists escrow_holds_status_idx on escrow_holds(status);
create index if not exists transactions_user_id_idx on transactions(user_id);
create index if not exists transactions_order_id_idx on transactions(order_id);
create index if not exists order_status_history_order_id_idx on order_status_history(order_id);

-- ============================================================
-- backend/src/db/migrations/006_communication_notifications.sql
-- ============================================================

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  title text not null,
  type text not null default 'order',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  body text not null,
  kind text not null default 'text',
  created_at timestamptz not null default now(),
  constraint messages_body_not_blank_chk check (length(trim(body)) > 0)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists conversations_order_id_unique_idx
  on conversations(order_id)
  where order_id is not null;

create index if not exists conversations_job_id_idx on conversations(job_id);
create index if not exists conversations_last_message_at_idx on conversations(last_message_at desc nulls last);
create index if not exists conversation_participants_user_id_idx on conversation_participants(user_id);
create index if not exists messages_conversation_id_created_at_idx on messages(conversation_id, created_at desc);
create index if not exists messages_sender_id_idx on messages(sender_id);
create index if not exists notifications_user_id_created_at_idx on notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on notifications(user_id, created_at desc) where read_at is null;

-- ============================================================
-- backend/src/db/migrations/007_rpg_roadmap.sql
-- ============================================================

alter table performer_levels
  add column if not exists description text,
  add column if not exists accent text not null default '#0057ff',
  add column if not exists interview_required boolean not null default false;

update performer_levels
set description = case code
    when 'newcomer' then 'Стартовая точка: профиль создан, первые шаги уже видны заказчику.'
    when 'builder' then 'Исполнитель собрал базовый профиль, навыки и готов брать первые задачи.'
    when 'verified' then 'Платформа видит реальные действия: отклики, выбранные заявки и первые завершения.'
    when 'reliable' then 'Надежный исполнитель с историей заказов и минимальным количеством спорных ситуаций.'
    when 'pro' then 'Сильный специалист с устойчивой статистикой, высоким доверием и портфолио.'
    when 'elite' then 'Максимальный уровень Fastik: требуется ручная проверка и HR-интервью платформы.'
    else description
  end,
  accent = case code
    when 'newcomer' then '#6b7280'
    when 'builder' then '#0057ff'
    when 'verified' then '#177245'
    when 'reliable' then '#ff4d1c'
    when 'pro' then '#171717'
    when 'elite' then '#b45309'
    else accent
  end,
  interview_required = code = 'elite';

create table if not exists performer_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  source_type text,
  source_id uuid,
  dedupe_key text not null,
  xp integer not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists performer_xp_events_user_id_created_at_idx
  on performer_xp_events(user_id, created_at desc);
create index if not exists performer_xp_events_type_idx on performer_xp_events(type);
create index if not exists performer_xp_events_source_idx on performer_xp_events(source_type, source_id);

-- ============================================================
-- backend/src/db/migrations/008_admin_moderation.sql
-- ============================================================

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_actor_id_idx on admin_actions(actor_id);
create index if not exists admin_actions_target_idx on admin_actions(target_type, target_id);
create index if not exists admin_actions_created_at_idx on admin_actions(created_at desc);

-- ============================================================
-- backend/src/db/migrations/009_reviews_ratings.sql
-- ============================================================

create table if not exists order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reviewer_id uuid not null references users(id) on delete cascade,
  performer_id uuid not null references users(id) on delete cascade,
  rating integer not null,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_reviews_rating_chk check (rating between 1 and 5),
  constraint order_reviews_comment_chk check (length(trim(comment)) >= 10),
  constraint order_reviews_not_self_chk check (reviewer_id <> performer_id),
  unique (order_id, reviewer_id)
);

create index if not exists order_reviews_performer_id_created_at_idx
  on order_reviews(performer_id, created_at desc);
create index if not exists order_reviews_reviewer_id_idx on order_reviews(reviewer_id);

-- ============================================================
-- backend/src/db/migrations/010_elite_interviews.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/011_job_invites.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/012_message_attachments.sql
-- ============================================================

create table if not exists message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes integer not null default 0,
  created_at timestamptz not null default now(),
  constraint message_attachments_file_name_chk check (length(trim(file_name)) > 0),
  constraint message_attachments_file_url_chk check (length(trim(file_url)) > 0),
  constraint message_attachments_size_chk check (size_bytes >= 0 and size_bytes <= 524288)
);

create index if not exists message_attachments_message_id_idx
  on message_attachments(message_id);

-- ============================================================
-- backend/src/db/migrations/013_contests.sql
-- ============================================================

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

-- ============================================================
-- backend/src/db/migrations/014_user_settings.sql
-- ============================================================

alter table users
  add column if not exists notification_settings jsonb not null default '{
    "email": {"messages": true, "applications": true, "orders": true, "marketing": false},
    "inApp": {"messages": true, "applications": true, "orders": true}
  }'::jsonb;
