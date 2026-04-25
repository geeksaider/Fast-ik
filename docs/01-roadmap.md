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

## Блок 7.5. Навигация и UX-ориентация

Статус: готово, базовый слой.

Цель:

- убрать повторяющиеся шапки и навигационные элементы;
- сделать dashboard картой продукта;
- упростить мобильную навигацию;
- сохранить узкий, собранный визуальный стиль без тяжелых эффектов.

Сделано:

- добавлен общий `SiteNavigation`;
- desktop использует единую верхнюю навигацию;
- mobile использует компактную верхнюю бренд-зону и нижний tab bar;
- удалены повторяющиеся page headers на ключевых страницах;
- `/dashboard` стал продуктовым хабом с быстрыми переходами, прогрессом профиля, заказами, финансами, чатами, уведомлениями и LVL-roadmap;
- уплотнены рабочие страницы `/jobs`, `/orders`, `/finance`, `/level-roadmap`;
- внешние контентные оболочки приведены к единой ширине `1044px`;
- desktop-header сокращен: основные разделы остались текстовыми, вторичные действия стали компактными icon-actions;
- исправлена активная навигация для `/jobs/new`;
- добавлены front-end "Показать еще" для длинных списков заказов, диалогов, уведомлений и транзакций;
- добавлен устойчивый форматтер даты/времени вместо raw timestamp;
- добавлен форматтер display-текста, который чистит timestamp-фрагменты внутри названий заказов/диалогов;
- сырые системные коды статусов, событий и транзакций переведены в русские label;
- `/dashboard` упрощен: крупные цветные карточки заменены компактным списком разделов;
- добавлены небольшие ненавязчивые transition-анимации;
- проведена браузерная проверка мобильных экранов `/`, `/jobs`, `/orders`, `/finance`, `/level-roadmap`.

## Блок 8. Админка и модерация

Статус: готово, базовый слой.

Цель:

- пользователи;
- заказы;
- жалобы;
- споры;
- финансы;
- уровни;
- категории;
- audit log.

Сделано:

- миграция `admin_actions` для audit-log;
- demo-аккаунты `support`, `moderator`, `admin`, `super_admin`;
- `GET /api/admin/overview`;
- `GET /api/admin/users`;
- `PATCH /api/admin/users/:id/status`;
- `GET /api/admin/disputes`;
- `POST /api/admin/disputes/:id/resolve`;
- `GET /api/admin/moderation/jobs`;
- `POST /api/admin/moderation/jobs/:id`;
- `GET /api/admin/audit-log`;
- разграничение прав: support видит споры, moderator видит модерацию, admin/super admin видят полный операционный контур;
- решение спора реально меняет order, escrow, wallets, transactions, history и notifications;
- страница `/admin` с вкладками сводки, споров, модерации, пользователей и журнала действий;
- навигация показывает админку только manager-ролям.

Осталось расширить позже:

- отдельный HR/interview экран для Elite-уровня;
- более глубокая модерация профилей и портфолио;
- категории и системные настройки;
- фильтры и backend pagination внутри админки.

## Блок 9. Дипломный polish

Цель:

- mock-данные;
- адаптивная доводка;
- аналитика;
- схемы БД;
- архитектурные диаграммы;
- пояснительная записка;
- презентация.
