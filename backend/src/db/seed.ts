import { closePool, pool } from './pool.js';
import bcrypt from 'bcryptjs';

const roles = [
  ['guest', 'Гость', 'Публичный доступ без авторизации'],
  ['customer', 'Заказчик', 'Создает заказы и выбирает исполнителей'],
  ['performer', 'Исполнитель', 'Откликается на заказы и развивает профиль'],
  ['support', 'Поддержка', 'Помогает пользователям и участвует в спорах'],
  ['moderator', 'Модератор', 'Проверяет контент и жалобы'],
  ['admin', 'Администратор', 'Управляет операционными разделами платформы'],
  ['super_admin', 'Суперадмин', 'Имеет полный системный доступ'],
];

const categories = [
  ['Разработка', 'development', 'Сайты, приложения, backend, frontend и интеграции'],
  ['Дизайн', 'design', 'UI/UX, брендинг, графика и презентации'],
  ['Тексты', 'copywriting', 'Копирайтинг, редактура, сценарии и переводы'],
  ['Маркетинг', 'marketing', 'Реклама, SEO, SMM и аналитика продвижения'],
  ['Администрирование', 'administration', 'DevOps, серверы, базы данных и поддержка'],
  ['Тестирование', 'qa', 'QA, ручное и автоматизированное тестирование'],
  ['Аналитика', 'analytics', 'Бизнес-анализ, продуктовая аналитика и отчеты'],
  ['No-code', 'no-code', 'Tilda, Bubble, Make, Airtable и автоматизации'],
];

const levels = [
  [
    'newcomer',
    'Новичок',
    0,
    1,
    'Стартовая точка: профиль создан, первые шаги уже видны заказчику.',
    '#6b7280',
    false,
  ],
  [
    'builder',
    'Исполнитель',
    150,
    2,
    'Исполнитель собрал базовый профиль, навыки и готов брать первые задачи.',
    '#0057ff',
    false,
  ],
  [
    'verified',
    'Проверенный',
    500,
    3,
    'Платформа видит реальные действия: отклики, выбранные заявки и первые завершения.',
    '#177245',
    false,
  ],
  [
    'reliable',
    'Надежный',
    1200,
    4,
    'Надежный исполнитель с историей заказов и минимальным количеством спорных ситуаций.',
    '#ff4d1c',
    false,
  ],
  [
    'pro',
    'Профи',
    2500,
    5,
    'Сильный специалист с устойчивой статистикой, высоким доверием и портфолио.',
    '#171717',
    false,
  ],
  [
    'elite',
    'Fastik Elite',
    5000,
    6,
    'Максимальный уровень Fastik: требуется ручная проверка и HR-интервью платформы.',
    '#b45309',
    true,
  ],
];

const demoUsers = [
  ['customer@fastik.local', 'Антон Заказчик', 'customer'],
  ['performer@fastik.local', 'Мария Исполнитель', 'performer'],
  ['admin@fastik.local', 'Fastik Admin', 'admin'],
];

const demoJobs = [
  {
    title: 'Собрать лендинг для SaaS-сервиса',
    description:
      'Нужен аккуратный адаптивный лендинг с hero-блоком, тарифами, FAQ и формой заявки. Важно: без визуального шума, быстро и современно.',
    categorySlug: 'development',
    budgetMin: 45_000,
    budgetMax: 90_000,
    tags: ['vue', 'tailwind', 'landing'],
  },
  {
    title: 'Разработать дизайн личного кабинета',
    description:
      'Ищем UI/UX-дизайнера для dashboard фриланс-платформы. Нужны 5-7 экранов, компоненты и понятная логика состояний.',
    categorySlug: 'design',
    budgetMin: 70_000,
    budgetMax: 140_000,
    tags: ['ui-ux', 'figma', 'dashboard'],
  },
  {
    title: 'Настроить PostgreSQL и Docker для MVP',
    description:
      'Требуется помочь с Docker Compose, миграциями и базовой структурой PostgreSQL для небольшого marketplace-проекта.',
    categorySlug: 'administration',
    budgetMin: 30_000,
    budgetMax: 60_000,
    tags: ['docker', 'postgresql', 'backend'],
  },
];

const skills = [
  ['Vue', 'vue', 'development'],
  ['TypeScript', 'typescript', 'development'],
  ['Node.js', 'node-js', 'development'],
  ['PostgreSQL', 'postgresql', 'development'],
  ['UI/UX', 'ui-ux', 'design'],
  ['Figma', 'figma', 'design'],
  ['SEO', 'seo', 'marketing'],
  ['SMM', 'smm', 'marketing'],
  ['QA', 'qa', 'qa'],
  ['Docker', 'docker', 'administration'],
  ['Техническое задание', 'technical-specification', 'analytics'],
  ['No-code автоматизация', 'no-code-automation', 'no-code'],
];

const run = async () => {
  for (const role of roles) {
    await pool.query(
      `insert into roles (code, title, description)
       values ($1, $2, $3)
       on conflict (code) do update set title = excluded.title, description = excluded.description`,
      role,
    );
  }

  for (const category of categories) {
    await pool.query(
      `insert into categories (name, slug, description)
       values ($1, $2, $3)
       on conflict (slug) do update set name = excluded.name, description = excluded.description`,
      category,
    );
  }

  for (const skill of skills) {
    await pool.query(
      `insert into skills (name, slug, category_id)
       select $1, $2, categories.id
       from categories
       where categories.slug = $3
       on conflict (slug) do update set name = excluded.name, category_id = excluded.category_id`,
      skill,
    );
  }

  for (const level of levels) {
    await pool.query(
      `insert into performer_levels (
         code,
         title,
         required_xp,
         sort_order,
         description,
         accent,
         interview_required
       )
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (code) do update set
         title = excluded.title,
         required_xp = excluded.required_xp,
         sort_order = excluded.sort_order,
         description = excluded.description,
         accent = excluded.accent,
         interview_required = excluded.interview_required`,
      level,
    );
  }

  const passwordHash = await bcrypt.hash('Fastik123!', 12);

  for (const user of demoUsers) {
    await pool.query(
      `insert into users (email, display_name, password_hash, role_id, email_verified)
       select $1, $2, $3, roles.id, true
       from roles
       where roles.code = $4
       on conflict (email) do update
       set display_name = excluded.display_name,
           password_hash = excluded.password_hash,
           role_id = excluded.role_id,
           email_verified = true,
           updated_at = now()`,
      [user[0], user[1], passwordHash, user[2]],
    );
  }

  const demoWallets = [
    ['customer@fastik.local', 750_000],
    ['performer@fastik.local', 80_000],
    ['admin@fastik.local', 0],
  ];

  for (const wallet of demoWallets) {
    await pool.query(
      `insert into wallets (user_id, available_balance, held_balance)
       select users.id, $2, 0
       from users
       where users.email = $1
       on conflict (user_id) do nothing`,
      wallet,
    );
  }

  for (const job of demoJobs) {
    const jobResult = await pool.query<{ id: string }>(
      `insert into jobs (
         customer_id,
         category_id,
         title,
         description,
         budget_min,
         budget_max,
         status,
         moderation_status
       )
       select customer.id, categories.id, $1, $2, $3, $4, 'published', 'approved'
       from users customer
       join categories on categories.slug = $5
       where customer.email = 'customer@fastik.local'
         and not exists (
           select 1 from jobs existing
           where existing.customer_id = customer.id and existing.title = $1
         )
       returning id`,
      [job.title, job.description, job.budgetMin, job.budgetMax, job.categorySlug],
    );
    const jobId = jobResult.rows[0]?.id;

    if (!jobId) {
      continue;
    }

    for (const tag of job.tags) {
      await pool.query(
        'insert into job_tags (job_id, tag) values ($1, $2) on conflict do nothing',
        [jobId, tag],
      );
    }
  }

  console.log('Seed data is ready');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
