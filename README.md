# Boilerworks TS

TypeScript full-stack boilerplate — NestJS + Prisma + Pothos GraphQL + Next.js. Forms engine, workflow engine, visual builders, session auth, permissions, and more.

Sister project to [boilerworks-django-nextjs](https://github.com/ConflictHQ/boilerworks-django-nextjs). Same architecture, same features, TypeScript runtime.

---

## Stack

| Layer    | Tech                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| Backend  | NestJS 11, Prisma 6, Pothos GraphQL, GraphQL Yoga, Postgres 16, Redis 7           |
| Frontend | Next.js 16 (App Router), Apollo Client 4, TypeScript, Tailwind CSS 4, shadcn/ui   |
| Auth     | Auth0 SSO + password fallback, session-based (httpOnly cookies), group-based RBAC |
| Infra    | Docker Compose, MinIO (S3), Mailpit, OpenSearch, Prisma Studio                    |

---

## Features

- **Forms engine** — JSON Schema definitions, 21+ field types, visual drag-and-drop builder, live preview, versioning (draft → published → archived), public submissions, analytics
- **Workflow engine** — JSON state machines, visual ReactFlow builder, conditions + actions, transition audit trail, polymorphic attachment
- **Auth** — Auth0 SSO + password login, session management, password reset, email verification, user invitations
- **Permissions** — Group-based RBAC, `requireAuth` + `requirePermission` guards, permission debugging tool
- **Organizations** — Multi-tenancy with roles (owner/admin/member)
- **API keys** — Service account tokens for programmatic access (`bw_live_...`)
- **File uploads** — S3/MinIO presigned URLs
- **Email** — Nodemailer with templates (Mailpit for local)
- **Notifications** — In-app CRUD, unread count, mark read
- **Rule engine** — Condition evaluator (8 operators), model/trigger filtering
- **Webhooks** — HMAC-signed outgoing delivery
- **CSV import/export** — Parse + generate with quoting
- **Search** — OpenSearch integration (feature-gated, Prisma fallback)
- **Feature flags** — Env-based toggles that gate module registration
- **Audit logging** — All mutations tracked with filters
- **Dashboard** — Summary cards, charts (Recharts)
- **i18n** — 7 languages, dark mode, data tables (TanStack)
- **Security** — Helmet, CORS, CSRF protection, exception filter, cookie hardening
- **CI** — GitHub Actions (lint, build, test with Postgres + Redis)
- **DX** — `run.sh` command center, scaffold command, schema export

---

## Getting Started

```shell
git clone https://github.com/ConflictHQ/boilerworks-ts.git
cd boilerworks-ts
cp local.env.example local.env   # Edit with your Auth0 credentials
npm install
./run.sh up                       # Start Docker stack + run migrations
./run.sh seed                     # Load dev fixtures
```

Open http://localhost:3000 and log in with `admin@boilerworks.dev` / `admin123`.

---

## Local URLs

| Service       | URL                                           |
| ------------- | --------------------------------------------- |
| Frontend      | http://localhost:3000                         |
| API (GraphQL) | http://localhost:4000/graphql                 |
| Prisma Studio | http://localhost:5555                         |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Mailpit       | http://localhost:8025                         |
| OpenSearch    | http://localhost:9200                         |
| Postgres      | localhost:5432 (dbadmin/dbadmin)              |
| Redis         | localhost:6379                                |

---

## Project Structure

```
apps/
  api/          # NestJS backend (Prisma, Pothos, auth, forms, workflows)
  web/          # Next.js frontend (shadcn/ui, Apollo, forms/workflow builders)
packages/
  shared/       # Shared types (planned — form fields, permissions)
docker/         # Docker Compose + Dockerfiles (dev + prod)
```

---

## Documentation

- [`bootstrap.md`](bootstrap.md) — primary conventions doc (backend patterns)
- [`apps/web/bootstrap.md`](apps/web/bootstrap.md) — frontend conventions
- [`memory.md`](memory.md) — AI context seed (architectural decisions, gotchas)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branching, code style, testing, PRs

---

## License

MIT

---

Boilerworks is a [Conflict](https://weareconflict.com) brand. CONFLICT is a registered trademark of Conflict LLC.
