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

## Проверки

```bash
npm run typecheck
npm run build
npm run format:check
```

## Текущий этап

Собран фундамент проекта: рабочая структура, Docker Compose, PostgreSQL, backend health endpoints, Swagger, frontend стартовая страница и базовая дизайн-система.
