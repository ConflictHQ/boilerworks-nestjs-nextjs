# Claude — Boilerworks TS

TypeScript full-stack boilerplate. NestJS backend + Next.js frontend.

## Architecture

- **Monorepo**: Turborepo with `apps/api`, `apps/web`, `packages/shared`
- **Backend**: NestJS with Prisma ORM, Pothos GraphQL, BullMQ for jobs
- **Frontend**: Next.js 16 App Router, Apollo Client, shadcn/ui
- **Auth**: Session-based (httpOnly cookies), group-based RBAC
- **Infrastructure**: Docker Compose (Postgres, Redis, MinIO, Mailpit)

## Conventions

- Prefer `Edit` over rewriting whole files
- Never expose raw database IDs in API responses — use cuid or relay global IDs
- Auth check required at the top of every GraphQL resolver and mutation
- Group-based permissions only — never assign to users directly
- Soft-delete pattern: `deletedAt` field, never call `.delete()` on business objects
- Use Zod for validation at API boundaries
- Use Prisma transactions for multi-model mutations

## GraphQL

- **Framework**: Pothos with Prisma plugin + Relay plugin
- **Schema**: `apps/api/src/graphql/schema.ts` assembles all types
- **Pattern**: builder.prismaObject for types, builder.queryField/mutationField for operations
- **Context**: user, session, prisma client, dataloaders

## Testing

- Vitest for unit/integration tests
- Supertest for e2e API tests
- Every test asserts against database state, not hardcoded strings
