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
