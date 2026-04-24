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
  ['newcomer', 'Новичок', 0, 1],
  ['builder', 'Исполнитель', 150, 2],
  ['verified', 'Проверенный', 500, 3],
  ['reliable', 'Надежный', 1200, 4],
  ['pro', 'Профи', 2500, 5],
  ['elite', 'Fastik Elite', 5000, 6],
];

const demoUsers = [
  ['customer@fastik.local', 'Антон Заказчик', 'customer'],
  ['performer@fastik.local', 'Мария Исполнитель', 'performer'],
  ['admin@fastik.local', 'Fastik Admin', 'admin'],
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

  for (const level of levels) {
    await pool.query(
      `insert into performer_levels (code, title, required_xp, sort_order)
       values ($1, $2, $3, $4)
       on conflict (code) do update set title = excluded.title, required_xp = excluded.required_xp, sort_order = excluded.sort_order`,
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
