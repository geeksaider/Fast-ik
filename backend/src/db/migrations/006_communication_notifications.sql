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
