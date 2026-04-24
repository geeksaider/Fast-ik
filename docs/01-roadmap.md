# Fastik Development Roadmap

## Блок 0. Фундамент

Статус: готово.

Состав:

- структура `frontend/`, `backend/`, `shared/`, `docs/`, `infra/`;
- npm workspaces;
- Docker Compose с PostgreSQL;
- полный Docker dev-режим для `web`, `api`, `postgres`;
- Prettier;
- `.env.example`;
- Express API;
- Swagger/OpenAPI;
- health endpoints;
- Vue frontend;
- Tailwind CSS;
- стартовая страница Fastik;
- README запуска.

## Блок 1. Auth и роли

Статус: готово.

Цель:

- регистрация;
- вход;
- JWT;
- роли пользователей;
- middleware доступа;
- страницы входа и регистрации.

Сделано:

- регистрация ролей `customer` и `performer`;
- demo-аккаунты заказчика, исполнителя и админа;
- password hashing через `bcryptjs`;
- JWT access token;
- endpoint `GET /api/auth/me`;
- middleware `requireAuth`;
- middleware `requireRoles`;
- страницы `/login`, `/register`, `/dashboard`;
- хранение сессии на frontend;
- Swagger-документация auth endpoints.

## Блок 2. Onboarding и профили

Статус: готово.

Цель:

- выбор роли;
- заполнение профиля;
- профиль заказчика;
- профиль исполнителя;
- навыки;
- портфолио;
- первые требования RPG-прогресса.

Сделано:

- таблицы `user_profiles`, `customer_profiles`, `performer_profiles`;
- таблицы `skills`, `user_skills`, `portfolio_items`;
- seed стартовых навыков по категориям;
- `GET /api/profile/me`;
- `PUT /api/profile/me`;
- `GET /api/profile/options/skills`;
- `PUT /api/profile/me/skills`;
- `POST /api/profile/me/portfolio`;
- `DELETE /api/profile/me/portfolio/:id`;
- protected route `/onboarding`;
- визуальный прогресс заполнения профиля;
- начисление стартового XP за onboarding-шаги исполнителя.

## Блок 3. Marketplace

Статус: готово.

Цель:

- категории;
- создание заказа;
- список заказов;
- страница заказа;
- фильтры;
- отклики;
- выбор исполнителя.

Сделано:

- таблицы `jobs`, `job_tags`, `job_applications`;
- seed demo-заказов;
- `GET /api/marketplace/categories`;
- `GET /api/marketplace/jobs`;
- `POST /api/marketplace/jobs`;
- `GET /api/marketplace/jobs/:id`;
- `POST /api/marketplace/jobs/:id/applications`;
- `POST /api/marketplace/jobs/:jobId/applications/:applicationId/select`;
- страницы `/jobs`, `/jobs/new`, `/jobs/:id`;
- создание заказа заказчиком;
- отклик исполнителя;
- выбор исполнителя заказчиком.

## Блок 4. Заказы в работе

Статус: следующий блок.

Цель:

- статусы заказа;
- история статусов;
- старт работы;
- сдача результата;
- принятие;
- отмена;
- спор.

## Блок 5. Коммуникация

Цель:

- диалоги;
- сообщения;
- уведомления;
- обмен файлами после начала общения.

## Блок 6. Мок-финансы и гарант

Цель:

- моковый баланс;
- пополнение;
- резервирование средств;
- escrow;
- выплата;
- возврат;
- история транзакций;
- админское решение споров.

## Блок 7. RPG-система

Цель:

- XP;
- уровни;
- roadmap;
- бейджи;
- требования уровней;
- ручная проверка;
- HR/interview mock-flow.

## Блок 8. Админка и модерация

Цель:

- пользователи;
- заказы;
- жалобы;
- споры;
- финансы;
- уровни;
- категории;
- audit log.

## Блок 9. Дипломный polish

Цель:

- mock-данные;
- адаптивная доводка;
- аналитика;
- схемы БД;
- архитектурные диаграммы;
- пояснительная записка;
- презентация.
