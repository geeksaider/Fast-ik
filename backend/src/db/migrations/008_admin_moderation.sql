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
