# Calliope — Boilerworks TS
<!-- Agent shim for https://github.com/calliopeai/calliope-cli -->

Primary conventions doc: [`bootstrap.md`](bootstrap.md)
Context seed: [`memory.md`](memory.md)

Read both before writing any code.

---

## Project-specific notes

- Turborepo monorepo (`apps/api`, `apps/web`, `packages/shared`): NestJS + Prisma + Pothos GraphQL (GraphQL Yoga) + BullMQ backend; Next.js 16 App Router + Apollo Client + shadcn/ui + Tailwind frontend.
- Session-based auth (Auth0 SSO + password fallback, httpOnly cookies); group-based RBAC only (User → UserGroup → Group → Permission) — never assign to users directly; auth check at the top of every resolver/mutation.
- Prisma `cuid()` IDs — never expose raw database IDs (use cuid or relay global IDs); soft deletes via Prisma Extensions (`deletedAt`, never `prisma.model.delete()` on business objects).
- GraphQL via Pothos (Prisma + Relay plugins), schema assembled at `apps/api/src/graphql/schema.ts`; mutations always return `MutationResult { ok, errors }`; Zod validation at API boundaries; Prisma transactions for multi-model mutations.
- Docker Compose: postgres, redis, minio, mailpit, opensearch, prisma-studio, api, web; feature flags via `config/features.ts`.
- Vitest + Supertest tests against a real database (both allowed and denied permission cases); run `npm run lint` before committing. This shim covers the repo root — `apps/web` has its own bootstrap.
