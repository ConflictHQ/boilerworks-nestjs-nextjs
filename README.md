# Boilerworks TS

TypeScript full-stack boilerplate — NestJS + Prisma + Pothos GraphQL + Next.js. Forms engine, workflow engine, visual builders, session auth, permissions, and more.

Sister project to [boilerworks-django-nextjs](https://github.com/ConflictHQ/boilerworks-django-nextjs). Same architecture, same features, TypeScript runtime.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | NestJS, Prisma, Pothos GraphQL, BullMQ, Postgres, Redis |
| Frontend | Next.js 16 (App Router), Apollo Client, TypeScript, Tailwind CSS, shadcn/ui |
| Infra | Docker Compose, MinIO (S3), Mailpit |

---

## Features (planned)

- Forms engine (JSON Schema, 21+ field types, visual builder)
- Workflow engine (state machines, conditions, actions, visual builder)
- Session auth with SSO support
- Group-based RBAC permissions
- File uploads (S3/MinIO)
- Background jobs (BullMQ)
- Email + in-app notifications
- Audit logging
- Feature toggles
- Dashboard with charts
- i18n, dark mode, data tables

---

## Getting Started

```shell
git clone https://github.com/ConflictHQ/boilerworks-ts.git
cd boilerworks-ts
npm install
docker compose up -d
npm run dev
```

---

## Project Structure

```
apps/
  api/          # NestJS backend (Prisma, Pothos, BullMQ)
  web/          # Next.js frontend (shadcn/ui, Apollo)
packages/
  shared/       # Shared types (form fields, permissions, workflow types)
docker/         # Docker Compose + Dockerfiles
```

---

## License

MIT
