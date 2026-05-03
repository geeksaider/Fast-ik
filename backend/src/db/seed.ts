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
  ['support@fastik.local', 'Fastik Support', 'support'],
  ['moderator@fastik.local', 'Fastik Moderator', 'moderator'],
  ['admin@fastik.local', 'Fastik Admin', 'admin'],
  ['superadmin@fastik.local', 'Fastik Super Admin', 'super_admin'],
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
    moderationStatus: 'approved',
  },
  {
    title: 'Разработать дизайн личного кабинета',
    description:
      'Ищем UI/UX-дизайнера для dashboard фриланс-платформы. Нужны 5-7 экранов, компоненты и понятная логика состояний.',
    categorySlug: 'design',
    budgetMin: 70_000,
    budgetMax: 140_000,
    tags: ['ui-ux', 'figma', 'dashboard'],
    moderationStatus: 'approved',
  },
  {
    title: 'Настроить PostgreSQL и Docker для MVP',
    description:
      'Требуется помочь с Docker Compose, миграциями и базовой структурой PostgreSQL для небольшого marketplace-проекта.',
    categorySlug: 'administration',
    budgetMin: 30_000,
    budgetMax: 60_000,
    tags: ['docker', 'postgresql', 'backend'],
    moderationStatus: 'approved',
  },
  {
    title: 'Проверить мобильный UX кабинета',
    description:
      'Нужна аккуратная проверка адаптива, навигации и читаемости карточек. Заказ специально оставлен в очереди модерации для demo admin flow.',
    categorySlug: 'qa',
    budgetMin: 18_000,
    budgetMax: 35_000,
    tags: ['qa', 'mobile', 'ux'],
    moderationStatus: 'pending',
  },
];

const demoContests = [
  {
    title: 'Конкурс: редизайн карточки заказа Fastik',
    brief:
      'Нужно предложить компактную карточку заказа для биржи: бюджет, срок, количество откликов и CTA должны читаться без визуального шума. Победит решение, которое лучше всего поддерживает быстрый выбор исполнителя.',
    categorySlug: 'design',
    requiredLevelCode: 'builder',
    prizeAmount: 25_000,
    tags: ['ui-ux', 'marketplace', 'cards'],
  },
  {
    title: 'Конкурс: идея для Roadmap исполнителя',
    brief:
      'Нужна концепция блока, который объясняет исполнителю путь роста: что уже сделано, что мешает следующему уровню и зачем проходить HR-интервью на Elite. Формат: краткое описание, структура и ссылка на мокап по желанию.',
    categorySlug: 'analytics',
    requiredLevelCode: 'verified',
    prizeAmount: 45_000,
    tags: ['roadmap', 'rpg', 'trust'],
  },
];

const skills = [
  ['Vue', 'vue', 'development'],
  ['TypeScript', 'typescript', 'development'],
  ['Node.js', 'node-js', 'development'],
  ['Tailwind CSS', 'tailwind', 'development'],
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
    ['support@fastik.local', 0],
    ['moderator@fastik.local', 0],
    ['admin@fastik.local', 0],
    ['superadmin@fastik.local', 0],
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

  await pool.query(
    `insert into user_profiles (user_id, bio, city, website_url, telegram, preferred_language)
     select
       users.id,
       'Продуктовая команда, которая регулярно публикует задачи для интерфейсов, QA и разработки. Нужны понятные сроки, аккуратная коммуникация и прозрачная приемка.',
       'Москва',
       null,
       '@anton_fastik',
       'ru'
     from users
     where users.email = 'customer@fastik.local'
     on conflict (user_id) do update set
       bio = excluded.bio,
       city = excluded.city,
       website_url = excluded.website_url,
       telegram = excluded.telegram,
       preferred_language = excluded.preferred_language,
       updated_at = now()`,
  );

  await pool.query(
    `insert into customer_profiles (
       user_id,
       company_name,
       company_site,
       company_description,
       project_budget_min,
       project_budget_max,
       moderation_status
     )
     select
       users.id,
       'Fastik Demo Studio',
       null,
       'Демо-заказчик для проверки заказов, конкурсов, мок-гаранта и рабочих чатов. Профиль показывает исполнителю, кто стоит за задачей.',
       20000,
       150000,
       'approved'
     from users
     where users.email = 'customer@fastik.local'
     on conflict (user_id) do update set
       company_name = excluded.company_name,
       company_site = excluded.company_site,
       company_description = excluded.company_description,
       project_budget_min = excluded.project_budget_min,
       project_budget_max = excluded.project_budget_max,
       moderation_status = excluded.moderation_status,
       updated_at = now()`,
  );

  await pool.query(
    `insert into user_profiles (user_id, bio, city, website_url, telegram, preferred_language)
     select
       users.id,
       'Frontend/Vue разработчик, который любит аккуратные кабинеты, быстрые интерфейсы и понятную коммуникацию по задачам.',
       'Санкт-Петербург',
       null,
       '@maria_fastik',
       'ru'
     from users
     where users.email = 'performer@fastik.local'
     on conflict (user_id) do update set
       bio = excluded.bio,
       city = excluded.city,
       website_url = excluded.website_url,
       telegram = excluded.telegram,
       preferred_language = excluded.preferred_language,
       updated_at = now()`,
  );

  await pool.query(
    `insert into performer_profiles (
       user_id,
       headline,
       hourly_rate,
       availability,
       experience_years,
       specialization,
       onboarding_completed
     )
     select
       users.id,
       'Vue / UI engineer для быстрых продуктовых интерфейсов',
       2500,
       'project',
       4,
       'Frontend, dashboard, marketplace UX',
       true
     from users
     where users.email = 'performer@fastik.local'
     on conflict (user_id) do update set
       headline = excluded.headline,
       hourly_rate = excluded.hourly_rate,
       availability = excluded.availability,
       experience_years = excluded.experience_years,
       specialization = excluded.specialization,
       onboarding_completed = excluded.onboarding_completed,
       updated_at = now()`,
  );

  for (const skill of [
    ['vue', 'senior'],
    ['typescript', 'middle'],
    ['ui-ux', 'middle'],
    ['tailwind', 'middle'],
    ['qa', 'middle'],
  ]) {
    await pool.query(
      `insert into user_skills (user_id, skill_id, level)
       select users.id, skills.id, $2
       from users
       join skills on skills.slug = $1
       where users.email = 'performer@fastik.local'
       on conflict (user_id, skill_id) do update set level = excluded.level`,
      skill,
    );
  }

  for (const item of [
    [
      'Кабинет для маркетплейса задач',
      'Собрала адаптивный dashboard: статусы, фильтры, карточки заказов и мягкую навигацию без перегруза.',
      null,
    ],
    [
      'Мобильный UX-аудит сервиса',
      'Проверила адаптив, читаемость, состояния форм и подготовила список быстрых улучшений для команды.',
      null,
    ],
  ]) {
    await pool.query(
      `insert into portfolio_items (user_id, title, description, project_url)
       select users.id, $1, $2, $3
       from users
       where users.email = 'performer@fastik.local'
         and not exists (
           select 1 from portfolio_items existing
           where existing.user_id = users.id and existing.title = $1
         )`,
      item,
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
       select customer.id, categories.id, $1, $2, $3, $4, 'published', $6
       from users customer
       join categories on categories.slug = $5
       where customer.email = 'customer@fastik.local'
         and not exists (
           select 1 from jobs existing
           where existing.customer_id = customer.id and existing.title = $1
       )
       returning id`,
      [
        job.title,
        job.description,
        job.budgetMin,
        job.budgetMax,
        job.categorySlug,
        job.moderationStatus,
      ],
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

  for (const contest of demoContests) {
    const contestResult = await pool.query<{ id: string }>(
      `insert into contests (
         customer_id,
         category_id,
         required_level_id,
         title,
         brief,
         prize_amount,
         status
       )
       select customer.id, categories.id, performer_levels.id, $1, $2, $3, 'open'
       from users customer
       join categories on categories.slug = $4
       join performer_levels on performer_levels.code = $5
       where customer.email = 'customer@fastik.local'
         and not exists (
           select 1 from contests existing
           where existing.customer_id = customer.id and existing.title = $1
       )
       returning id`,
      [
        contest.title,
        contest.brief,
        contest.prizeAmount,
        contest.categorySlug,
        contest.requiredLevelCode,
      ],
    );
    const contestId = contestResult.rows[0]?.id;

    if (!contestId) {
      continue;
    }

    for (const tag of contest.tags) {
      await pool.query(
        'insert into contest_tags (contest_id, tag) values ($1, $2) on conflict do nothing',
        [contestId, tag],
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
