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

Статус: готово.

Цель:

- статусы заказа;
- история статусов;
- старт работы;
- сдача результата;
- принятие;
- отмена;
- спор.

Сделано:

- таблицы `orders`, `order_status_history`;
- таблицы `wallets`, `transactions`, `escrow_holds`;
- выбор исполнителя создает order и escrow hold;
- моковый баланс заказчика резервируется при выборе исполнителя;
- `GET /api/orders`;
- `GET /api/orders/:id`;
- `POST /api/orders/:id/submit`;
- `POST /api/orders/:id/accept`;
- `POST /api/orders/:id/dispute`;
- `POST /api/orders/:id/cancel`;
- `GET /api/finance/me`;
- `POST /api/finance/top-up`;
- страницы `/orders`, `/orders/:id`, `/finance`;
- выплата исполнителю после принятия работы;
- возврат заказчику при отмене.

## Блок 5. Коммуникация

Статус: готово.

Цель:

- диалоги;
- сообщения;
- уведомления;
- обмен файлами после начала общения.

Сделано:

- таблицы `conversations`, `conversation_participants`, `messages`;
- таблица `notifications`;
- автоматическое создание рабочего чата после выбора исполнителя;
- системное сообщение при создании чата;
- `GET /api/conversations`;
- `GET /api/conversations/:id`;
- `POST /api/conversations/:id/messages`;
- `GET /api/notifications`;
- `POST /api/notifications/:id/read`;
- `POST /api/notifications/read-all`;
- уведомления при новом отклике, выборе исполнителя, сдаче работы, принятии, споре, отмене и новом сообщении;
- unread-счетчики для сообщений и уведомлений;
- страницы `/messages`, `/messages/:id`, `/notifications`;
- ссылка на рабочий чат из карточки заказа.

## Блок 6. Мок-финансы и гарант

Статус: базовый слой готов в блоке 4, админское решение споров остается будущим расширением.

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

Статус: готово, базовый слой.

Цель:

- XP;
- уровни;
- roadmap;
- бейджи;
- требования уровней;
- ручная проверка;
- HR/interview mock-flow.

Сделано:

- расширены `performer_levels`: описание, акцент, флаг интервью;
- таблица `performer_xp_events`;
- идемпотентные XP-события через `dedupe_key`;
- пересчет `performer_progress` из профиля и реальных действий;
- XP за отправленный отклик;
- XP за выбранную заявку;
- XP за сдачу результата;
- XP за завершенный заказ;
- уведомление при повышении уровня;
- `GET /api/levels/me`;
- страница `/level-roadmap`;
- требования уровней: профиль, навыки, портфолио, выбранные заявки, завершенные заказы, отсутствие активных споров, HR-интервью для Elite.

Осталось расширить позже:

- ручной экран HR/interview для админа;
- бейджи как отдельные сущности;
- связь с отзывами и рейтингом после блока Reviews.

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
