import { closePool, pool } from './pool.js';
import bcrypt from 'bcryptjs';

const roles = [
  ['guest', 'Гость', 'Публичный доступ без авторизации'],
  ['customer', 'Заказчик', 'Создает заказы и выбирает исполнителей'],
  ['performer', 'Исполнитель', 'Откликается на заказы и развивает профиль'],
  ['admin', 'Администратор', 'Управляет всеми операционными разделами платформы'],
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
  ['customer.ops@fastik.local', 'Елена Продуктова', 'customer'],
  ['customer.growth@fastik.local', 'Илья Growth', 'customer'],
  ['performer.backend@fastik.local', 'Иван Backend', 'performer'],
  ['performer.design@fastik.local', 'Алина UX', 'performer'],
  ['performer.qa@fastik.local', 'Олег QA', 'performer'],
  ['performer.nocode@fastik.local', 'Софья No-code', 'performer'],
  ['performer.elite@fastik.local', 'Дмитрий Elite', 'performer'],
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
    deadlineDays: 12,
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
    deadlineDays: 18,
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
    deadlineDays: 5,
  },
  {
    title: 'Проверить мобильный UX кабинета',
    description:
      'Нужна аккуратная проверка адаптива, навигации и читаемости карточек. Заказ оставлен в очереди модерации для проверки рабочего процесса.',
    categorySlug: 'qa',
    budgetMin: 18_000,
    budgetMax: 35_000,
    tags: ['qa', 'mobile', 'ux'],
    moderationStatus: 'pending',
    deadlineDays: 3,
  },
  {
    title: 'Доработать карточку заказов в личном кабинете',
    description:
      'Нужно компактно собрать статус, срок, гарантию, исполнителя и следующее действие в списке заказов без лишних пояснений.',
    categorySlug: 'design',
    budgetMin: 28_000,
    budgetMax: 55_000,
    tags: ['ui-ux', 'cards', 'dashboard'],
    moderationStatus: 'approved',
    deadlineDays: 7,
  },
  {
    title: 'Сверстать страницу заявок заказчика',
    description:
      'Нужна аккуратная Vue-страница для сравнения откликов: фильтры, краткие метрики, выбор исполнителя и адаптив.',
    categorySlug: 'development',
    budgetMin: 40_000,
    budgetMax: 85_000,
    tags: ['vue', 'typescript', 'marketplace'],
    moderationStatus: 'approved',
    deadlineDays: 10,
  },
  {
    title: 'Проверить сценарий оплаты через гаранта',
    description:
      'Нужно пройти пользовательский сценарий от публикации заказа до удержания суммы и приемки результата.',
    categorySlug: 'qa',
    budgetMin: 20_000,
    budgetMax: 42_000,
    tags: ['qa', 'payments', 'escrow'],
    moderationStatus: 'approved',
    deadlineDays: 2,
  },
  {
    title: 'Подготовить SEO-структуру для каталога исполнителей',
    description:
      'Нужно собрать структуру посадочных страниц, мета-тексты и короткий план внутренней перелинковки для каталога специалистов.',
    categorySlug: 'marketing',
    budgetMin: 24_000,
    budgetMax: 48_000,
    tags: ['seo', 'catalog', 'growth'],
    moderationStatus: 'pending',
    deadlineDays: 9,
  },
  {
    title: 'Написать автотесты для оформления заказа',
    description:
      'Нужны базовые e2e-сценарии: публикация задачи, отклик, выбор исполнителя, создание заказа и проверка статусов гаранта.',
    categorySlug: 'qa',
    budgetMin: 55_000,
    budgetMax: 110_000,
    tags: ['qa', 'e2e', 'orders'],
    moderationStatus: 'approved',
    deadlineDays: 16,
  },
  {
    title: 'Собрать no-code CRM для заявок',
    description:
      'Нужно быстро собрать Airtable/Make-процесс для входящих заявок, статусов и уведомлений менеджера.',
    categorySlug: 'no-code',
    budgetMin: 35_000,
    budgetMax: 75_000,
    tags: ['airtable', 'make', 'crm'],
    moderationStatus: 'rejected',
    deadlineDays: 14,
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
      'Нужна концепция блока, который объясняет исполнителю путь роста: что уже сделано, что мешает следующему уровню и зачем проходить HR-интервью на Elite. Формат: краткое описание, структура и ссылка на прототип по желанию.',
    categorySlug: 'analytics',
    requiredLevelCode: 'verified',
    prizeAmount: 45_000,
    tags: ['roadmap', 'rpg', 'trust'],
  },
  {
    title: 'Конкурс: текст для страницы доверия',
    brief:
      'Нужен короткий, уверенный текст о гаранте, уровнях исполнителей и ручной проверке Elite без технического жаргона.',
    categorySlug: 'copywriting',
    requiredLevelCode: 'newcomer',
    prizeAmount: 18_000,
    tags: ['copywriting', 'trust', 'product'],
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

  await pool.query(`delete from users where email = any($1::text[])`, [
    ['support@fastik.local', 'moderator@fastik.local', 'superadmin@fastik.local'],
  ]);

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
    ['customer.ops@fastik.local', 520_000],
    ['customer.growth@fastik.local', 390_000],
    ['performer.backend@fastik.local', 130_000],
    ['performer.design@fastik.local', 210_000],
    ['performer.qa@fastik.local', 95_000],
    ['performer.nocode@fastik.local', 70_000],
    ['performer.elite@fastik.local', 310_000],
  ];

  for (const wallet of demoWallets) {
    await pool.query(
      `insert into wallets (user_id, available_balance, held_balance)
       select users.id, $2, 0
       from users
       where users.email = $1
       on conflict (user_id) do update set
         available_balance = excluded.available_balance,
         held_balance = 0,
         updated_at = now()`,
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
       'Fastik Studio',
       null,
       'Заказчик с регулярными задачами, конкурсами, гарантом и рабочими чатами. Профиль показывает исполнителю, кто стоит за задачей.',
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

  const additionalCustomers = [
    {
      email: 'customer.ops@fastik.local',
      bio: 'Операционная команда, которая запускает внутренние сервисы, кабинеты и интеграции для поддержки клиентов.',
      city: 'Казань',
      telegram: '@ops_fastik',
      companyName: 'OpsKit',
      companyDescription:
        'Заказчик с регулярными задачами по автоматизации, аналитике и поддержке внутренних процессов.',
      budgetMin: 35_000,
      budgetMax: 180_000,
    },
    {
      email: 'customer.growth@fastik.local',
      bio: 'Growth-команда, которой нужны быстрые лендинги, тексты, SEO и эксперименты без долгого найма.',
      city: 'Екатеринбург',
      telegram: '@growth_fastik',
      companyName: 'GrowthLab',
      companyDescription:
        'Публикует задачи на маркетинг, тексты, аналитику и продуктовые страницы.',
      budgetMin: 20_000,
      budgetMax: 120_000,
    },
  ];

  for (const customer of additionalCustomers) {
    await pool.query(
      `insert into user_profiles (user_id, bio, city, website_url, telegram, preferred_language)
       select users.id, $2, $3, null, $4, 'ru'
       from users
       where users.email = $1
       on conflict (user_id) do update set
         bio = excluded.bio,
         city = excluded.city,
         telegram = excluded.telegram,
         preferred_language = excluded.preferred_language,
         updated_at = now()`,
      [customer.email, customer.bio, customer.city, customer.telegram],
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
       select users.id, $2, null, $3, $4, $5, 'approved'
       from users
       where users.email = $1
       on conflict (user_id) do update set
         company_name = excluded.company_name,
         company_description = excluded.company_description,
         project_budget_min = excluded.project_budget_min,
         project_budget_max = excluded.project_budget_max,
         moderation_status = excluded.moderation_status,
         updated_at = now()`,
      [
        customer.email,
        customer.companyName,
        customer.companyDescription,
        customer.budgetMin,
        customer.budgetMax,
      ],
    );
  }

  const performerProfiles = [
    {
      email: 'performer.backend@fastik.local',
      bio: 'Backend-разработчик для API, PostgreSQL, Docker и интеграций. Любит короткие ТЗ и прозрачные приемки.',
      city: 'Новосибирск',
      telegram: '@ivan_backend',
      headline: 'Node.js / PostgreSQL разработчик для marketplace-проектов',
      rate: 3200,
      years: 6,
      specialization: 'Backend, API, PostgreSQL, Docker',
      levelCode: 'pro',
      xp: 3800,
      completedOrders: 14,
      rating: 4.9,
      interviewRequired: false,
      interviewPassed: false,
      skills: [
        ['node-js', 'senior'],
        ['postgresql', 'senior'],
        ['docker', 'middle'],
        ['technical-specification', 'middle'],
      ],
      portfolio: [
        [
          'API для сервиса заявок',
          'Спроектировал REST API, миграции PostgreSQL, роли пользователей и журнал событий.',
        ],
      ],
    },
    {
      email: 'performer.design@fastik.local',
      bio: 'UX/UI дизайнер для личных кабинетов, маркетплейсов и продуктовых интерфейсов с плотной информацией.',
      city: 'Москва',
      telegram: '@alina_ux',
      headline: 'UX/UI дизайнер для сложных кабинетов',
      rate: 2800,
      years: 5,
      specialization: 'Product design, dashboards, design systems',
      levelCode: 'reliable',
      xp: 1650,
      completedOrders: 8,
      rating: 4.8,
      interviewRequired: false,
      interviewPassed: false,
      skills: [
        ['ui-ux', 'senior'],
        ['figma', 'senior'],
        ['technical-specification', 'middle'],
      ],
      portfolio: [
        [
          'Дизайн кабинета B2B-платформы',
          'Собрала экран заявок, карточки кандидатов и быстрые действия для менеджера.',
        ],
      ],
    },
    {
      email: 'performer.qa@fastik.local',
      bio: 'QA-инженер для проверки адаптива, оплаты, заявок и критических пользовательских сценариев.',
      city: 'Пермь',
      telegram: '@oleg_qa',
      headline: 'QA-инженер для ручного и e2e тестирования',
      rate: 1900,
      years: 3,
      specialization: 'Manual QA, e2e, regression',
      levelCode: 'verified',
      xp: 780,
      completedOrders: 5,
      rating: 4.7,
      interviewRequired: false,
      interviewPassed: false,
      skills: [
        ['qa', 'senior'],
        ['technical-specification', 'middle'],
        ['typescript', 'junior'],
      ],
      portfolio: [
        [
          'Регрессия оплаты и заказов',
          'Проверил сценарии гаранта, споров и уведомлений перед релизом.',
        ],
      ],
    },
    {
      email: 'performer.nocode@fastik.local',
      bio: 'No-code специалист: CRM, Airtable, Make, быстрые внутренние процессы и уведомления.',
      city: 'Ростов-на-Дону',
      telegram: '@sofia_nocode',
      headline: 'No-code автоматизация для отделов продаж',
      rate: 1700,
      years: 2,
      specialization: 'Airtable, Make, CRM, automation',
      levelCode: 'builder',
      xp: 260,
      completedOrders: 2,
      rating: 4.6,
      interviewRequired: false,
      interviewPassed: false,
      skills: [
        ['no-code-automation', 'middle'],
        ['technical-specification', 'junior'],
      ],
      portfolio: [
        [
          'CRM для заявок',
          'Собрала таблицы, статусы, уведомления и простую аналитику без разработки.',
        ],
      ],
    },
    {
      email: 'performer.elite@fastik.local',
      bio: 'Сильный fullstack-разработчик с опытом запуска MVP, архитектуры и ревью сложных задач.',
      city: 'Санкт-Петербург',
      telegram: '@dmitry_elite',
      headline: 'Fullstack архитектор для MVP и сложных интеграций',
      rate: 4600,
      years: 8,
      specialization: 'Fullstack, architecture, reviews, integrations',
      levelCode: 'elite',
      xp: 5600,
      completedOrders: 23,
      rating: 5,
      interviewRequired: false,
      interviewPassed: true,
      skills: [
        ['vue', 'senior'],
        ['typescript', 'senior'],
        ['node-js', 'senior'],
        ['postgresql', 'senior'],
      ],
      portfolio: [
        [
          'MVP маркетплейса за 8 недель',
          'Настроил архитектуру, роли, платежный сценарий и операционную админку.',
        ],
      ],
    },
  ];

  for (const performer of performerProfiles) {
    await pool.query(
      `insert into user_profiles (user_id, bio, city, website_url, telegram, preferred_language)
       select users.id, $2, $3, null, $4, 'ru'
       from users
       where users.email = $1
       on conflict (user_id) do update set
         bio = excluded.bio,
         city = excluded.city,
         telegram = excluded.telegram,
         preferred_language = excluded.preferred_language,
         updated_at = now()`,
      [performer.email, performer.bio, performer.city, performer.telegram],
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
       select users.id, $2, $3, 'project', $4, $5, true
       from users
       where users.email = $1
       on conflict (user_id) do update set
         headline = excluded.headline,
         hourly_rate = excluded.hourly_rate,
         availability = excluded.availability,
         experience_years = excluded.experience_years,
         specialization = excluded.specialization,
         onboarding_completed = excluded.onboarding_completed,
         updated_at = now()`,
      [
        performer.email,
        performer.headline,
        performer.rate,
        performer.years,
        performer.specialization,
      ],
    );

    await pool.query(
      `insert into performer_progress (
         user_id,
         level_id,
         xp,
         completed_orders,
         rating,
         interview_required,
         interview_passed,
         updated_at
       )
       select users.id, performer_levels.id, $3, $4, $5, $6, $7, now()
       from users
       join performer_levels on performer_levels.code = $2
       where users.email = $1
       on conflict (user_id) do update set
         level_id = excluded.level_id,
         xp = excluded.xp,
         completed_orders = excluded.completed_orders,
         rating = excluded.rating,
         interview_required = excluded.interview_required,
         interview_passed = excluded.interview_passed,
         updated_at = now()`,
      [
        performer.email,
        performer.levelCode,
        performer.xp,
        performer.completedOrders,
        performer.rating,
        performer.interviewRequired,
        performer.interviewPassed,
      ],
    );

    for (const skill of performer.skills) {
      await pool.query(
        `insert into user_skills (user_id, skill_id, level)
         select users.id, skills.id, $3
         from users
         join skills on skills.slug = $2
         where users.email = $1
         on conflict (user_id, skill_id) do update set level = excluded.level`,
        [performer.email, skill[0], skill[1]],
      );
    }

    for (const item of performer.portfolio) {
      await pool.query(
        `insert into portfolio_items (user_id, title, description, project_url)
         select users.id, $2, $3, null
         from users
         where users.email = $1
           and not exists (
             select 1 from portfolio_items existing
             where existing.user_id = users.id and existing.title = $2
           )`,
        [performer.email, item[0], item[1]],
      );
    }
  }

  await pool.query(
    `insert into performer_progress (
       user_id,
       level_id,
       xp,
       completed_orders,
       rating,
       interview_required,
       interview_passed,
       updated_at
     )
     select users.id, performer_levels.id, 5200, 19, 4.9, true, false, now()
     from users
     join performer_levels on performer_levels.code = 'pro'
     where users.email = 'performer@fastik.local'
     on conflict (user_id) do update set
       level_id = excluded.level_id,
       xp = excluded.xp,
       completed_orders = excluded.completed_orders,
       rating = excluded.rating,
       interview_required = excluded.interview_required,
       interview_passed = excluded.interview_passed,
       updated_at = now()`,
  );

  for (const job of demoJobs) {
    const jobResult = await pool.query<{ id: string }>(
      `insert into jobs (
         customer_id,
         category_id,
         title,
         description,
         budget_min,
         budget_max,
         deadline_at,
         status,
         moderation_status
       )
       select
         customer.id,
         categories.id,
         $1,
         $2,
         $3,
         $4,
         current_date + ($7::int * interval '1 day'),
         'published',
         $6
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
        job.deadlineDays,
      ],
    );
    const jobId = jobResult.rows[0]?.id;

    if (jobId) {
      for (const tag of job.tags) {
        await pool.query(
          'insert into job_tags (job_id, tag) values ($1, $2) on conflict do nothing',
          [jobId, tag],
        );
      }
    }

    await pool.query(
      `update jobs
       set description = $2,
           budget_min = $3,
           budget_max = $4,
           deadline_at = current_date + ($5::int * interval '1 day'),
           moderation_status = $6,
           updated_at = now()
       where title = $1`,
      [
        job.title,
        job.description,
        job.budgetMin,
        job.budgetMax,
        job.deadlineDays,
        job.moderationStatus,
      ],
    );
  }

  const demoApplications = [
    {
      jobTitle: 'Собрать лендинг для SaaS-сервиса',
      performerEmail: 'performer@fastik.local',
      price: 82_000,
      days: 10,
      status: 'selected',
      letter:
        'Соберу быстрый лендинг на Vue/Tailwind, подготовлю адаптив и аккуратные состояния формы.',
    },
    {
      jobTitle: 'Собрать лендинг для SaaS-сервиса',
      performerEmail: 'performer.design@fastik.local',
      price: 76_000,
      days: 8,
      status: 'pending',
      letter: 'Могу начать с структуры и прототипа, затем передать разработчику чистый UI-kit.',
    },
    {
      jobTitle: 'Разработать дизайн личного кабинета',
      performerEmail: 'performer.design@fastik.local',
      price: 125_000,
      days: 14,
      status: 'pending',
      letter:
        'Соберу плотный dashboard, состояния заявок, компоненты и мобильную версию без визуального перегруза.',
    },
    {
      jobTitle: 'Настроить PostgreSQL и Docker для MVP',
      performerEmail: 'performer.backend@fastik.local',
      price: 52_000,
      days: 5,
      status: 'selected',
      letter:
        'Настрою compose, миграции, healthcheck и понятный порядок запуска для разработчика и стенда.',
    },
    {
      jobTitle: 'Проверить мобильный UX кабинета',
      performerEmail: 'performer.qa@fastik.local',
      price: 28_000,
      days: 3,
      status: 'pending',
      letter: 'Проверю адаптив, навигацию, формы и подготовлю список конкретных правок по экранам.',
    },
    {
      jobTitle: 'Доработать карточку заказов в личном кабинете',
      performerEmail: 'performer.design@fastik.local',
      price: 50_000,
      days: 6,
      status: 'selected',
      letter: 'Уплотню карточку, сделаю понятный следующий шаг и сохраню быстрый скан списка.',
    },
    {
      jobTitle: 'Сверстать страницу заявок заказчика',
      performerEmail: 'performer@fastik.local',
      price: 72_000,
      days: 9,
      status: 'pending',
      letter:
        'Сделаю Vue-страницу с фильтрами, сравнением кандидатов, понятной выборкой и адаптивом.',
    },
    {
      jobTitle: 'Проверить сценарий оплаты через гаранта',
      performerEmail: 'performer@fastik.local',
      price: 38_000,
      days: 2,
      status: 'selected',
      letter:
        'Пройду сценарий гаранта от удержания до спорной ситуации, оформлю результат по шагам.',
    },
    {
      jobTitle: 'Написать автотесты для оформления заказа',
      performerEmail: 'performer.qa@fastik.local',
      price: 92_000,
      days: 12,
      status: 'pending',
      letter: 'Покрою основной путь заказа e2e-сценариями и добавлю регресс для статусов гаранта.',
    },
    {
      jobTitle: 'Собрать no-code CRM для заявок',
      performerEmail: 'performer.nocode@fastik.local',
      price: 58_000,
      days: 7,
      status: 'pending',
      letter:
        'Соберу CRM на Airtable и Make, но после уточнения требований по уведомлениям и ролям.',
    },
  ];

  for (const application of demoApplications) {
    await pool.query(
      `insert into job_applications (job_id, performer_id, cover_letter, price, delivery_days, status)
       select jobs.id, users.id, $3, $4, $5, $6
       from jobs
       join users on users.email = $2
       where jobs.title = $1
       on conflict (job_id, performer_id) do update set
         cover_letter = excluded.cover_letter,
         price = excluded.price,
         delivery_days = excluded.delivery_days,
         status = excluded.status,
         updated_at = now()`,
      [
        application.jobTitle,
        application.performerEmail,
        application.letter,
        application.price,
        application.days,
        application.status,
      ],
    );
  }

  const demoOrders = [
    {
      jobTitle: 'Собрать лендинг для SaaS-сервиса',
      performerEmail: 'performer@fastik.local',
      amount: 82_000,
      status: 'in_progress',
      escrowStatus: 'held',
      workResult: null,
      note: 'Заказ создан, средства удержаны гарантом, работа идет по плану.',
    },
    {
      jobTitle: 'Настроить PostgreSQL и Docker для MVP',
      performerEmail: 'performer.backend@fastik.local',
      amount: 52_000,
      status: 'submitted',
      escrowStatus: 'held',
      workResult:
        'Compose, миграции и healthcheck готовы. Нужна финальная проверка переменных окружения.',
      note: 'Исполнитель отправил результат на приемку.',
    },
    {
      jobTitle: 'Доработать карточку заказов в личном кабинете',
      performerEmail: 'performer.design@fastik.local',
      amount: 50_000,
      status: 'completed',
      escrowStatus: 'released',
      workResult: 'Макеты карточек, адаптивные состояния и спецификация переданы заказчику.',
      note: 'Заказ завершен, средства выплачены исполнителю.',
    },
    {
      jobTitle: 'Проверить сценарий оплаты через гаранта',
      performerEmail: 'performer@fastik.local',
      amount: 38_000,
      status: 'disputed',
      escrowStatus: 'disputed',
      workResult:
        'Проверка проведена, но заказчик запросил уточнение по спорному сценарию возврата.',
      note: 'Заказчик открыл спор: нужен комментарий платформы по результату проверки.',
    },
  ];

  for (const order of demoOrders) {
    const orderResult = await pool.query<{ id: string; jobId: string; customerId: string }>(
      `with selected_application as (
         select
           job_applications.id as application_id,
           jobs.id as job_id,
           jobs.customer_id,
           users.id as performer_id,
           jobs.title
         from jobs
         join job_applications on job_applications.job_id = jobs.id
         join users on users.id = job_applications.performer_id
         where jobs.title = $1 and users.email = $2
       )
       insert into orders (
         job_id,
         application_id,
         customer_id,
         performer_id,
         title,
         amount,
         status,
         work_result,
         submitted_at,
         completed_at,
         disputed_at,
         created_at,
         updated_at
       )
       select
         job_id,
         application_id,
         customer_id,
         performer_id,
         title,
         $3,
         $4,
         $5,
         case when $4 in ('submitted', 'completed', 'disputed') then now() - interval '1 day' end,
         case when $4 = 'completed' then now() - interval '12 hours' end,
         case when $4 = 'disputed' then now() - interval '4 hours' end,
         now() - interval '6 days',
         now()
       from selected_application
       on conflict (job_id) do update set
         application_id = excluded.application_id,
         performer_id = excluded.performer_id,
         amount = excluded.amount,
         status = excluded.status,
         work_result = excluded.work_result,
         submitted_at = excluded.submitted_at,
         completed_at = excluded.completed_at,
         disputed_at = excluded.disputed_at,
         updated_at = now()
       returning id, job_id as "jobId", customer_id as "customerId"`,
      [order.jobTitle, order.performerEmail, order.amount, order.status, order.workResult],
    );
    const seededOrder = orderResult.rows[0];

    if (!seededOrder) {
      continue;
    }

    await pool.query(
      `update jobs
       set selected_application_id = job_applications.id,
           status = case
             when $3 = 'completed' then 'completed'
             when $3 = 'disputed' then 'in_progress'
             else 'in_progress'
           end,
           updated_at = now()
       from job_applications
       join users on users.id = job_applications.performer_id
       where jobs.id = job_applications.job_id
         and jobs.title = $1
         and users.email = $2`,
      [order.jobTitle, order.performerEmail, order.status],
    );

    await pool.query(
      `insert into escrow_holds (
         order_id,
         job_id,
         application_id,
         customer_id,
         performer_id,
         amount,
         status,
         released_at,
         disputed_at
       )
       select
         orders.id,
         orders.job_id,
         orders.application_id,
         orders.customer_id,
         orders.performer_id,
         orders.amount,
         $2,
         case when $2 = 'released' then now() - interval '12 hours' end,
         case when $2 = 'disputed' then now() - interval '4 hours' end
       from orders
       where orders.id = $1
       on conflict (order_id) do update set
         amount = excluded.amount,
         status = excluded.status,
         released_at = excluded.released_at,
         disputed_at = excluded.disputed_at`,
      [seededOrder.id, order.escrowStatus],
    );

    await pool.query(
      `insert into order_status_history (order_id, status, actor_id, note)
       select $1, $2, users.id, $3
       from users
       where users.email = 'admin@fastik.local'
         and not exists (
           select 1 from order_status_history existing
           where existing.order_id = $1 and existing.status = $2 and existing.note = $3
         )`,
      [seededOrder.id, order.status, order.note],
    );

    await pool.query(
      `update conversations
       set title = 'Заказ: ' || orders.title,
           last_message_at = now() - interval '1 hour',
           updated_at = now()
       from orders
       where conversations.order_id = orders.id
         and orders.id = $1`,
      [seededOrder.id],
    );

    await pool.query(
      `insert into conversations (job_id, order_id, title, type, last_message_at)
       select jobs.id, orders.id, 'Заказ: ' || orders.title, 'order', now() - interval '1 hour'
       from orders
       join jobs on jobs.id = orders.job_id
       where orders.id = $1
         and not exists (
           select 1 from conversations existing
           where existing.order_id = orders.id
         )`,
      [seededOrder.id],
    );

    await pool.query(
      `insert into conversation_participants (conversation_id, user_id, last_read_at)
       select conversations.id, participant.id, now() - interval '30 minutes'
       from conversations
       join orders on orders.id = conversations.order_id
       join users participant on participant.id in (orders.customer_id, orders.performer_id)
       where orders.id = $1
       on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at`,
      [seededOrder.id],
    );

    await pool.query(
      `insert into messages (conversation_id, sender_id, body, kind, created_at)
       select conversations.id, users.id, $3, 'text', now() - interval '1 hour'
       from conversations
       join users on users.email = $2
       where conversations.order_id = $1
         and not exists (
           select 1 from messages existing
           where existing.conversation_id = conversations.id and existing.body = $3
         )`,
      [
        seededOrder.id,
        order.performerEmail,
        order.status === 'disputed'
          ? 'Отправил отчет, но вижу, что нужен дополнительный разбор спорного пункта.'
          : 'Передал текущий статус и готов ответить на вопросы по результату.',
      ],
    );

    if (order.status === 'completed') {
      await pool.query(
        `insert into order_reviews (order_id, reviewer_id, performer_id, rating, comment)
         select orders.id, orders.customer_id, orders.performer_id, 5,
                'Работа выполнена аккуратно: карточка стала плотнее, статусы и действия читаются быстрее.'
         from orders
         where orders.id = $1
         on conflict (order_id, reviewer_id) do update set
           rating = excluded.rating,
           comment = excluded.comment,
           updated_at = now()`,
        [seededOrder.id],
      );
    }
  }

  await pool.query(
    `update jobs
     set applications_count = counts.total
     from (
       select job_id, count(*)::int as total
       from job_applications
       group by job_id
     ) counts
     where counts.job_id = jobs.id`,
  );

  await pool.query(
    `update jobs
     set description = $2,
         updated_at = now()
     where title = $1`,
    [
      'Проверить мобильный UX кабинета',
      'Нужна аккуратная проверка адаптива, навигации и читаемости карточек. Заказ оставлен в очереди модерации для проверки рабочего процесса.',
    ],
  );

  await pool.query(
    `update transactions
     set description = 'Пополнение баланса'
     where description = 'Моковое пополнение баланса'`,
  );

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

  const demoContestSubmissions = [
    {
      contestTitle: 'Конкурс: редизайн карточки заказа Fastik',
      performerEmail: 'performer.design@fastik.local',
      pitch:
        'Предлагаю карточку с плотной верхней строкой: статус, бюджет, срок и короткое следующее действие. Основной акцент на быстром сравнении.',
      status: 'submitted',
    },
    {
      contestTitle: 'Конкурс: редизайн карточки заказа Fastik',
      performerEmail: 'performer@fastik.local',
      pitch:
        'Сделаю интерактивный Vue-прототип карточки: фильтры, статусы, счетчик откликов и безопасные CTA для заказчика.',
      status: 'submitted',
    },
    {
      contestTitle: 'Конкурс: идея для Roadmap исполнителя',
      performerEmail: 'performer.backend@fastik.local',
      pitch:
        'Roadmap должен показывать текущий уровень, ближайший барьер и проверяемые действия: профиль, заказы, рейтинг и интервью.',
      status: 'submitted',
    },
    {
      contestTitle: 'Конкурс: текст для страницы доверия',
      performerEmail: 'performer.nocode@fastik.local',
      pitch:
        'Предлагаю текст без технических терминов: как гарант защищает оплату, зачем уровни и почему Elite проходит ручную проверку.',
      status: 'submitted',
    },
  ];

  for (const submission of demoContestSubmissions) {
    await pool.query(
      `insert into contest_submissions (contest_id, performer_id, pitch, status)
       select contests.id, users.id, $3, $4
       from contests
       join users on users.email = $2
       where contests.title = $1
       on conflict (contest_id, performer_id) do update set
         pitch = excluded.pitch,
         status = excluded.status,
         updated_at = now()`,
      [submission.contestTitle, submission.performerEmail, submission.pitch, submission.status],
    );
  }

  await pool.query(
    `update contests
     set submissions_count = counts.total,
         updated_at = now()
     from (
       select contest_id, count(*)::int as total
       from contest_submissions
       group by contest_id
     ) counts
     where counts.contest_id = contests.id`,
  );

  const adminActions = [
    {
      targetType: 'job',
      targetTitle: 'Проверить мобильный UX кабинета',
      action: 'job_moderated',
      note: 'Заказ оставлен в очереди: нужно проверить формулировку результата и критерии приемки.',
      metadata: { moderationStatus: 'pending' },
    },
    {
      targetType: 'job',
      targetTitle: 'Собрать no-code CRM для заявок',
      action: 'job_moderated',
      note: 'Заказ отклонен до уточнения состава интеграций и ответственного за доступы.',
      metadata: { moderationStatus: 'rejected' },
    },
    {
      targetType: 'order',
      targetTitle: 'Проверить сценарий оплаты через гаранта',
      action: 'dispute_resolved',
      note: 'Спор ожидает решения: на защите можно показать оба варианта закрытия.',
      metadata: { resolution: 'pending', amount: 38_000 },
    },
    {
      targetType: 'performer',
      targetEmail: 'performer@fastik.local',
      action: 'performer_interview_decided',
      note: 'Кандидат дошел до порога Elite и ждет финального HR-решения платформы.',
      metadata: { status: 'pending' },
    },
  ];

  for (const action of adminActions) {
    await pool.query(
      `insert into admin_actions (actor_id, target_type, target_id, action, note, metadata, created_at)
       select
         admin_user.id,
         $1,
         case
           when $1 = 'job' then jobs.id
           when $1 = 'order' then orders.id
           when $1 = 'performer' then performer_user.id
         end,
         $4,
         $5,
         $6::jsonb,
         now() - interval '2 hours'
       from users admin_user
       left join jobs on jobs.title = $2
       left join orders on orders.title = $2
       left join users performer_user on performer_user.email = $3
       where admin_user.email = 'admin@fastik.local'
         and not exists (
           select 1 from admin_actions existing
           where existing.action = $4 and existing.note = $5
         )`,
      [
        action.targetType,
        action.targetTitle ?? null,
        action.targetEmail ?? null,
        action.action,
        action.note,
        JSON.stringify(action.metadata),
      ],
    );
  }

  const notifications = [
    {
      userEmail: 'customer@fastik.local',
      actorEmail: 'admin@fastik.local',
      type: 'order_disputed',
      title: 'Спор принят в работу',
      body: 'Платформа проверяет материалы по заказу «Проверить сценарий оплаты через гаранта».',
      linkUrl: '/orders',
    },
    {
      userEmail: 'performer@fastik.local',
      actorEmail: 'admin@fastik.local',
      type: 'interview_passed',
      title: 'Нужно финальное HR-решение',
      body: 'Вы дошли до порога Elite. Администратор может принять решение в панели управления.',
      linkUrl: '/level-roadmap',
    },
    {
      userEmail: 'customer@fastik.local',
      actorEmail: 'performer.design@fastik.local',
      type: 'contest_submission_received',
      title: 'Новая работа на конкурс',
      body: 'Алина UX отправила предложение для редизайна карточки заказа.',
      linkUrl: '/contests',
    },
  ];

  for (const notification of notifications) {
    await pool.query(
      `insert into notifications (user_id, actor_id, type, title, body, link_url)
       select recipient.id, actor.id, $3, $4, $5, $6
       from users recipient
       left join users actor on actor.email = $2
       where recipient.email = $1
         and not exists (
           select 1 from notifications existing
           where existing.user_id = recipient.id and existing.title = $4 and existing.body = $5
         )`,
      [
        notification.userEmail,
        notification.actorEmail,
        notification.type,
        notification.title,
        notification.body,
        notification.linkUrl,
      ],
    );
  }

  await pool.query(
    `update wallets
     set held_balance = coalesce(holds.held, 0),
         updated_at = now()
     from (
       select users.id as user_id, coalesce(sum(escrow_holds.amount), 0)::int as held
       from users
       left join escrow_holds on escrow_holds.customer_id = users.id
         and escrow_holds.status in ('held', 'disputed')
       group by users.id
     ) holds
     where holds.user_id = wallets.user_id`,
  );

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
