# Claude — Boilerworks TS

Primary conventions doc: [`bootstrap.md`](bootstrap.md)

Read it before writing any code.

---

## Claude-specific notes

- Prefer `Edit` over rewriting whole files
- Never expose raw database IDs — use cuid or relay global IDs
- Auth check at the top of every resolver and mutation — no exceptions
- Group-based permissions only — never assign to users directly
- Soft-delete: `deletedAt` field, never `prisma.model.delete()` on business objects
- Use Zod for validation at API boundaries
- Use Prisma transactions for multi-model mutations
- Run `npm run lint` before committing

## Stack

- **Monorepo**: Turborepo (`apps/api`, `apps/web`, `packages/shared`)
- **Backend**: NestJS with Prisma ORM, Pothos GraphQL, BullMQ for jobs
- **Frontend**: Next.js 16 App Router, Apollo Client, shadcn/ui, Tailwind CSS
- **Auth**: Session-based (httpOnly cookies), group-based RBAC
- **Infra**: Docker Compose (Postgres, Redis, MinIO, Mailpit)

## GraphQL

- **Framework**: Pothos with Prisma plugin + Relay plugin
- **Schema**: `apps/api/src/graphql/schema.ts` assembles all types
- **Pattern**: `builder.prismaObject` for types, `builder.queryField`/`builder.mutationField` for operations
- **Context**: `graphql/context.ts` — user, session, prisma client
- **Mutations**: Always return `MutationResult { ok, errors }`

## Testing

- Vitest for unit/integration tests
- Supertest for e2e API tests
- Every test asserts against database state, not hardcoded strings
- Test both allowed and denied permission cases
- Real database, not mocks
