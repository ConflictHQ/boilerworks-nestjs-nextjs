# Boilerworks TS — Memory

AI context seed for the Boilerworks TypeScript platform. Captures decisions, constraints, and non-obvious facts that are not derivable from reading the code.

For conventions and patterns, see [`bootstrap.md`](bootstrap.md) (backend) and [`apps/web/bootstrap.md`](apps/web/bootstrap.md) (frontend).

---

## Platform purpose

Full-stack TypeScript boilerplate for building SaaS products. NestJS backend + Next.js frontend. Part of the Boilerworks family — each edition is a ground-up build for its stack, sharing architectural principles but not code.

---

## Key architectural decisions

| Decision | Why |
|---|---|
| GraphQL (Pothos + Yoga) as primary API | Flexible querying from Next.js frontend; Pothos gives type-safe schema building with Prisma integration |
| Auth0 + backend session | Auth0 handles identity/login; backend creates local session stored in httpOnly cookie; same Auth0 tenant as Django edition |
| `cuid()` IDs on all models | Never expose sequential integer IDs; cuid is URL-safe and collision-resistant |
| Soft deletes via `deletedAt` | Compliance + audit requirement; never hard-delete business objects |
| Group-based RBAC, never direct user permissions | Simpler mental model; permission changes propagate via group membership |
| BullMQ + Redis for async jobs | NestJS-native, proven at scale; replaces Celery from the Django edition |
| Prisma ORM (not TypeORM, Drizzle) | Best type-safety story, excellent migration tooling, Pothos plugin |
| Monorepo with Turborepo | Shared types between API and frontend; single CI pipeline; independent builds |
| `bootstrap.md` as primary conventions doc | Single source of truth for all agents and humans; agent shims point here |

---

## Things that bite newcomers

- **Never call `.delete()` on business objects** — set `deletedAt` + `updatedById` instead.
- **Never expose raw database IDs in APIs** — always use cuid or Relay global ID.
- **Auth check is mandatory in every resolver and mutation** — the framework does not enforce this automatically.
- **`fetchPolicy` must be set explicitly** in every Apollo hook — no implicit defaults.
- **Never use `useQuery` in Server Components** — use `getClient().query()` instead.
- **Never use `getClient()` in Client Components** — use hooks from `graphql/<domain>/`.
- **Run `npm run lint` before committing** — Husky pre-commit hooks enforce this.
- **Prisma client must be regenerated** after schema changes: `npx prisma generate`.
- **Logic engine lives in `packages/shared/`** — both frontend and backend consume it; changes affect both.

---

## Infrastructure topology

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose (docker/)                           │
│                                                     │
│  api (NestJS) ──► postgres                          │
│     │                                               │
│     └──► redis ──► worker (BullMQ)                  │
│                                                     │
│  web (Next.js)   minio   mailpit                    │
└─────────────────────────────────────────────────────┘
```

All infrastructure runs in Docker. Node.js is required on the host for development (Turborepo watches `apps/api` and `apps/web` natively).

---

## Permissions model

```
User → (many) UserGroup → Group → (many) GroupPermission → Permission
```

Permissions are defined in `packages/shared` as the `P` enum. Check via `requirePermission(ctx, P.INVOICE_VIEW)`. Superusers bypass all checks. Assign via admin UI (Group management).

---

## Frontend notes

- Next.js App Router with RSC + client components
- Apollo Client for GraphQL; UNAUTHENTICATED errors redirect to login
- Dark mode via `next-themes`
- i18n planned via `next-intl`
- Auth is NestJS session via httpOnly cookie — no Auth0 or external IdP by default

---

## Test fixtures

`npm run db:seed` loads fixtures via `prisma/seed.ts`. Seeds are idempotent (uses `upsert`). Test user: `admin@boilerworks.dev` with superuser group.

---

## Sibling reference

The Django edition (`boilerworks-django-nextjs`) shares the same architectural principles. Useful for understanding "what features exist" and "what decisions were made", but implementations are independent — each edition is idiomatic to its stack.

---

## Integration points (separate Conflict products)

- **Navegador** — codebase knowledge graph. Can index this repo for structured AI agent context.
- **PlanOpticon** — meeting/document knowledge extraction. Can feed requirements into the platform.

These are not dependencies — they're complementary tools that can optionally work with any Boilerworks edition.
