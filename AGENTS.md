# Fastik Agent Notes

## Project

Fastik is a fullstack freelance marketplace for diploma demonstration, aimed at the Russian-speaking market and designed with near-production quality.

Official diploma topic:

`Разработка веб-приложения для организации сотрудничества между заказчиками и разработчиками программного обеспечения Fastik`

## Current Stage

Stage: foundation implementation.

The repository now contains the first fullstack skeleton: Vue frontend, Express backend, shared package, Docker Compose PostgreSQL setup, audit docs, and development roadmap.

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
- Dark theme is optional, not MVP-critical.

## Important Product Features

- Authentication
- User onboarding and profile completion
- Customer and performer dashboards
- Job creation
- Applications/responses
- Performer profiles and portfolio
- Chat
- Notifications
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

After the foundation is verified, the next implementation block is authentication and roles:

- registration;
- login;
- password hashing;
- JWT access flow;
- role-aware middleware;
- customer/performer/admin role model;
- login and registration screens.
