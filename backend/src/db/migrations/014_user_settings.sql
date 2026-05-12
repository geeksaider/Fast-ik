alter table users
  add column if not exists notification_settings jsonb not null default '{
    "email": {"messages": true, "applications": true, "orders": true, "marketing": false},
    "inApp": {"messages": true, "applications": true, "orders": true}
  }'::jsonb;
