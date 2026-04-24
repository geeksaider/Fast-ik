# Fastik

Fastik - дипломный fullstack-проект фриланс-биржи для организации сотрудничества между заказчиками и разработчиками программного обеспечения.

Проект ориентирован на русскоязычный рынок и соединяет классическую биржу заказов с RPG-системой доверия исполнителей.

## Стек

- Frontend: Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router
- Backend: Express, TypeScript, PostgreSQL, Swagger/OpenAPI
- Database: PostgreSQL без ORM, через SQL migrations и `pg`
- Infra: Docker Compose
- Formatting: Prettier

## Структура

```text
frontend/   Vue-приложение
backend/    Express API
shared/     Общие типы и константы
docs/       Аудит, планы, будущие схемы
infra/      Инфраструктурные файлы
```

## Быстрый запуск

### Вариант 1. Локальный frontend/backend + PostgreSQL в Docker

1. Установить зависимости:

```bash
npm install
```

2. Создать локальный env-файл:

```bash
cp .env.example .env
```

3. Запустить PostgreSQL:

```bash
npm run docker:up
```

4. Применить миграции и seed-данные:

```bash
npm run db:migrate
npm run db:seed
```

5. Запустить frontend и backend:

```bash
npm run dev
```

После запуска:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4200`
- Swagger: `http://localhost:4200/docs`
- Health: `http://localhost:4200/api/health`

### Вариант 2. Полный Docker dev

Этот режим поднимает PostgreSQL, backend и frontend в контейнерах.

```bash
cp .env.example .env
docker compose up --build
```

В отдельном терминале после первого запуска:

```bash
npm run docker:dev:setup
```

Полезные команды:

```bash
npm run docker:dev:detached
npm run docker:dev:logs
npm run docker:dev:down
```

Адреса в полном Docker dev:

- Frontend: `http://localhost`
- Backend API: `http://localhost:4200`
- Swagger: `http://localhost:4200/docs`

## Demo-аккаунты

После `npm run db:seed` доступны пользователи:

```text
customer@fastik.local / Fastik123!
performer@fastik.local / Fastik123!
admin@fastik.local / Fastik123!
```

## Проверки

```bash
npm run typecheck
npm run build
npm run format:check
```

## Текущий этап

Собран фундамент проекта и первый auth-блок:

- регистрация заказчика/исполнителя;
- вход по email/password;
- хеширование пароля;
- JWT access token;
- middleware авторизации и ролей;
- защищенный dashboard;
- onboarding и профили;
- навыки исполнителя;
- портфолио исполнителя;
- RPG-прогресс заполнения профиля;
- Swagger-раздел Auth.
- Swagger-раздел Profile.
- marketplace: категории, список заказов, создание заказа, страница заказа и отклики.
- Swagger-раздел Marketplace.
