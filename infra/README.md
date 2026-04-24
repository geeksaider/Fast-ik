# Infra

Инфраструктурные файлы Fastik.

## Базовый режим

Корневой `docker-compose.yml` поднимает только PostgreSQL. Это удобно, если frontend и backend запускаются локально через `npm run dev`.

```bash
npm run docker:up
npm run dev
```

## Полный Docker dev

`docker-compose.override.yml` добавляет dev-контейнеры `api` и `web` поверх базового PostgreSQL. Docker Compose подхватывает этот файл автоматически, поэтому полный dev запускается обычной командой.

```bash
docker compose up --build
```

После первого запуска или изменения схемы базы:

```bash
npm run docker:dev:setup
```

Сервисы:

- Web: `http://localhost`
- API: `http://localhost:4200`
- Swagger: `http://localhost:4200/docs`
- PostgreSQL: `localhost:5432`
