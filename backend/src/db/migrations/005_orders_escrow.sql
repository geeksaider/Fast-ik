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
