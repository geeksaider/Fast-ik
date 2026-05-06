# Fastik Agent Notes

## Project

Fastik is a fullstack freelance marketplace for diploma demonstration, aimed at the Russian-speaking market and designed with near-production quality.

Official diploma topic:

`Разработка веб-приложения для организации сотрудничества между заказчиками и разработчиками программного обеспечения Fastik`

## Current Stage

Stage: Third browser design annotation batch applied; final product-polish continues.

The repository contains the fullstack skeleton, auth flow, onboarding/profile slice, marketplace foundation, level-gated contests, public performer and customer catalogs, direct performer invitations to customer jobs, order workflow with wallet/guarantor simulation, REST-based conversations with file attachments and notifications, customer reviews after completed orders, performer rating impact on RPG progress, a role-aware analytics dashboard with quick action cards, applications overview with candidate actions, comparison stats and resettable filters, order deadline signals with URL-saved filters, focus cards and chat quick actions, a clearer performer level roadmap with current-focus cards, contest explanation blocks, a shared person avatar component, a simplified role-aware global navigation shell, a footer, a basic admin/moderation panel, and an admin Elite HR interview screen that records final performer interview decisions.

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
- Desktop navigation should stay in the top shell without extra duplicated page headers or too many text buttons.
- Dashboard is the product hub and should explain where each core section lives.
- Work pages should use dense hero blocks plus separate functional cards, so the first screen shows actionable content.
- Outer content shells should use the shared 1044px width.
- Lists should have simple front-end pagination or "show more" controls when they can grow long.
- Dates should be rendered through format helpers, never as raw timestamps.
- System codes such as statuses, event types and transaction directions should be rendered through readable Russian labels.
- Money should use `руб.` instead of the ruble glyph if the current font stack renders `₽` inconsistently.
- Avoid technical UI labels such as API status, ESCROW or XP SYSTEM unless they are translated into clear product language.
- Public-facing UI should avoid words like demo, mock and diploma; keep simulation details in internal docs, seed data or code only.
- Avoid global floating actions that can overlap forms or content; keep primary actions inside the relevant screen.
- Dashboard should prioritize guided next steps and compact navigation over many equally loud cards.
- Dark theme is optional, not MVP-critical.

## Important Product Features

- Authentication
- User onboarding and profile completion
- Customer and performer dashboards
- Job creation
- Applications/responses
- Applications overview for customers
- Performer profiles and portfolio
- Chat attached to order workflow
- Notifications with unread state
- Reviews and ratings
- Public performer catalog and profiles with level, rating, reviews, skills and portfolio
- Public customer profiles with company info, public jobs, contests and trust signals
- Search and filters
- Guarantor/escrow simulation
- Finance and transactions simulation
- Analytics
- Admin/moderation panels
- RPG level system and performer roadmap
- Contests with level-based participation
- Seed data for presentation and browser testing
- Russian language first, with optional i18n support

## Process Rules

- Build step by step by blocks.
- After each meaningful block, verify behavior and accept corrections.
- Keep this file updated as architecture and project decisions evolve.
- Do not introduce unrelated changes.
- Do not use destructive git commands unless explicitly requested.

## Current Next Block

Three browser annotation batches have been applied. Next work should focus on the user's personal review, applying any new annotation block page by page, and discussing remaining product decisions before VPS or documentation work:

- wait for the user's review of the latest annotation fixes;
- apply the next browser annotation block page by page if the user sends one;
- discuss final role-aware header content for customer, performer and manager roles;
- decide whether to add more editorial illustrations or keep the interface mostly typographic with avatars;
- discuss whether dark theme belongs to MVP or post-MVP;
- run a control browser pass across customer, performer and manager accounts.

Do not start VPS deployment preparation or diploma documentation preparation until the user explicitly asks for it.

## Demo Accounts

After running `npm run db:seed`, these accounts are available:

- `customer@fastik.local` / `Fastik123!`
- `performer@fastik.local` / `Fastik123!`
- `support@fastik.local` / `Fastik123!`
- `moderator@fastik.local` / `Fastik123!`
- `admin@fastik.local` / `Fastik123!`
- `superadmin@fastik.local` / `Fastik123!`
