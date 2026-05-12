insert into roles (code, title, description)
values
  ('guest', 'Гость', 'Публичный доступ без авторизации'),
  ('customer', 'Заказчик', 'Создает заказы и выбирает исполнителей'),
  ('performer', 'Исполнитель', 'Откликается на заказы и развивает профиль'),
  ('admin', 'Администратор', 'Управляет операционными разделами платформы')
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description;

insert into categories (name, slug, description)
values
  ('Разработка', 'development', 'Сайты, приложения, backend, frontend и интеграции'),
  ('Дизайн', 'design', 'UI/UX, брендинг, графика и презентации'),
  ('Тексты', 'copywriting', 'Копирайтинг, редактура, сценарии и переводы'),
  ('Маркетинг', 'marketing', 'Реклама, SEO, SMM и аналитика продвижения'),
  ('Администрирование', 'administration', 'DevOps, серверы, базы данных и поддержка'),
  ('Тестирование', 'qa', 'QA, ручное и автоматизированное тестирование'),
  ('Аналитика', 'analytics', 'Бизнес-анализ, продуктовая аналитика и отчеты'),
  ('No-code', 'no-code', 'Tilda, Bubble, Make, Airtable и автоматизации')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

insert into skills (name, slug, category_id)
select skill.name, skill.slug, categories.id
from (
  values
    ('Vue', 'vue', 'development'),
    ('TypeScript', 'typescript', 'development'),
    ('Node.js', 'node-js', 'development'),
    ('Tailwind CSS', 'tailwind', 'development'),
    ('PostgreSQL', 'postgresql', 'development'),
    ('UI/UX', 'ui-ux', 'design'),
    ('Figma', 'figma', 'design'),
    ('SEO', 'seo', 'marketing'),
    ('SMM', 'smm', 'marketing'),
    ('QA', 'qa', 'qa'),
    ('Docker', 'docker', 'administration'),
    ('Техническое задание', 'technical-specification', 'analytics'),
    ('No-code автоматизация', 'no-code-automation', 'no-code')
) as skill(name, slug, category_slug)
join categories on categories.slug = skill.category_slug
on conflict (slug) do update set
  name = excluded.name,
  category_id = excluded.category_id;

insert into performer_levels (
  code,
  title,
  required_xp,
  sort_order,
  description,
  accent,
  interview_required
)
values
  (
    'newcomer',
    'Новичок',
    0,
    1,
    'Стартовая точка: профиль создан, первые шаги уже видны заказчику.',
    '#6b7280',
    false
  ),
  (
    'builder',
    'Исполнитель',
    150,
    2,
    'Исполнитель собрал базовый профиль, навыки и готов брать первые задачи.',
    '#0057ff',
    false
  ),
  (
    'verified',
    'Проверенный',
    500,
    3,
    'Платформа видит реальные действия: отклики, выбранные заявки и первые завершения.',
    '#177245',
    false
  ),
  (
    'reliable',
    'Надежный',
    1200,
    4,
    'Надежный исполнитель с историей заказов и минимальным количеством спорных ситуаций.',
    '#ff4d1c',
    false
  ),
  (
    'pro',
    'Профи',
    2500,
    5,
    'Сильный специалист с устойчивой статистикой, высоким доверием и портфолио.',
    '#171717',
    false
  ),
  (
    'elite',
    'Fastik Elite',
    5000,
    6,
    'Максимальный уровень Fastik: требуется ручная проверка и HR-интервью платформы.',
    '#b45309',
    true
  )
on conflict (code) do update set
  title = excluded.title,
  required_xp = excluded.required_xp,
  sort_order = excluded.sort_order,
  description = excluded.description,
  accent = excluded.accent,
  interview_required = excluded.interview_required;
