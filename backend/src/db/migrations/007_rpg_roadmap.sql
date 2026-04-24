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
