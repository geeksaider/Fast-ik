# Fastik Agent Notes

## Project

Fastik is a fullstack freelance marketplace for diploma demonstration, aimed at the Russian-speaking market and designed with near-production quality.

Official diploma topic:

`Разработка веб-приложения для организации сотрудничества между заказчиками и разработчиками программного обеспечения Fastik`

## Current Stage

Stage: Navigation and UX polish.

The repository contains the fullstack skeleton, auth flow, onboarding/profile slice, marketplace foundation, order workflow with mock wallet/escrow, REST-based conversations with notifications, a performer RPG roadmap with XP events, and a global navigation shell.

Development can run in two modes:

- local app dev with PostgreSQL in Docker: `npm run docker:up` + `npm run dev`;
- full Docker dev with PostgreSQL, API and web containers: `docker compose up --build`.

## Product Direction

Fastik combines a freelance marketplace with an RPG-style trust and growth system for performers.

Core idea:

- Customers need a clear way to understand whether a performer is reliable.
- Performers progress through levels by completing meaningful platform actions.
- The highest level requires a real or simulated online HR/platform interview.
- The level roadmap should be visible, motivating, and useful rather than decorative.

## Target Roles

- Guest
- Customer
- Performer
- Support
- Moderator
- Admin
- Super admin

## Preferred Stack

- Frontend: Vue + TypeScript + Tailwind CSS
- Backend: Express + TypeScript
- Database: PostgreSQL
- API: REST
- Documentation: Swagger/OpenAPI
- Deployment target: VPS
- Containerization: Docker
- Full Docker dev mode: enabled via `docker-compose.override.yml`
- ORM: avoid if practical; use SQL/query layer directly
- Formatting: Prettier

## Code Style

- Keep code readable and straightforward.
- Avoid over-engineering and excessive generics.
- Avoid comments unless the reason is not obvious from the code.
- Prefer explicit feature structure over clever abstractions.
- UI should be narrow, modern, fast, reliable, and responsive.
- Use one icon pack consistently across the project.

## UI Direction

- Brand feeling: speed, modernity, reliability, fashion.
- Avoid heavy gradients.
- Avoid excessive shadows.
- Avoid overloaded animations.
- Use subtle, purposeful motion only.
- Responsive design is required.
- Mobile navigation should have one clear source of truth: compact top brand/actions plus bottom tab bar.
- Desktop navigation should stay in the top shell without extra duplicated page headers.
- Dashboard is the product hub and should explain where each core section lives.
- Work pages should use dense hero blocks plus separate functional cards, so the first screen shows actionable content.
- Dark theme is optional, not MVP-critical.

## Important Product Features

- Authentication
- User onboarding and profile completion
- Customer and performer dashboards
- Job creation
- Applications/responses
- Performer profiles and portfolio
- Chat attached to order workflow
- Notifications with unread state
- Reviews and ratings
- Search and filters
- Mock escrow/guarantor system
- Mock finances and transactions
- Analytics
- Admin/moderation panels
- RPG level system and performer roadmap
- Contests with level-based participation
- Mock/demo data for diploma presentation
- Russian language first, with optional i18n support

## Process Rules

- Build step by step by blocks.
- After each meaningful block, verify behavior and accept corrections.
- Keep this file updated as architecture and project decisions evolve.
- Do not introduce unrelated changes.
- Do not use destructive git commands unless explicitly requested.

## Current Next Block

After the navigation polish is verified, the next implementation block should be admin/moderation or reviews:

- admin/support views for disputes and moderation;
- reviews and rating events after completed orders;
- optional file attachments in order conversations.

## Demo Accounts

After running `npm run db:seed`, these accounts are available:

- `customer@fastik.local` / `Fastik123!`
- `performer@fastik.local` / `Fastik123!`
- `admin@fastik.local` / `Fastik123!`
