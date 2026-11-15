# Boilerworks TS

TypeScript full-stack boilerplate — NestJS + Prisma + Pothos GraphQL + Next.js. Forms engine, workflow engine, visual builders, session auth, permissions, and more.

Sister project to [boilerworks-django-nextjs](https://github.com/ConflictHQ/boilerworks-django-nextjs). Same architecture, same features, TypeScript runtime.

---

## Stack

| Layer    | Tech                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------- |
| Backend  | NestJS 11, Prisma 6, Pothos GraphQL, GraphQL Yoga, Postgres 16, Redis 7                             |
| Frontend | Next.js 16 (App Router), Apollo Client 4, TypeScript, Tailwind CSS 4, `@calliopelabs/ui`, shadcn/ui |
| Auth     | Auth0 SSO + password fallback, session-based (httpOnly cookies), group-based RBAC                   |
| Infra    | Docker Compose, MinIO (S3), Mailpit, OpenSearch, Prisma Studio                                      |

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

## The Calliope AI happy path

This template is the reference for building on the Calliope AI design system and platform. A new app made from it starts on the shared UI library, deploys on Astrolift, shows its Storybook in the Calliope AI UX front door, and receives library upgrades automatically.

### What the template ships

- **The design system.** `apps/web` depends on [`@calliopelabs/ui`](https://www.npmjs.com/package/@calliopelabs/ui). `app/globals.css` imports its Tailwind preset (tokens, theme map, `dark:` on `data-mode`, base layer). The root layout renders `AppearanceScript` in `<head>` and mounts `AppearanceProvider` and `UIProvider`, the latter through `ui-app/providers/UiEnvironment.tsx`, which gives the library `next/link` and translates every string it renders from the `ui` namespace of `messages/<locale>.json`.
- **The product.** `ui-app/product.ts` defines the app with `defineProduct`: a neutral `boilerworks` brand and the navigation model the sidebar and breadcrumb read.
- **The shell and patterns from the library.** `AppShell`, `Sidebar`, `BrandMark`, `UserMenu`, `Breadcrumbs`, `PageHeader`, `DataTable`, `EmptyState`, `ErrorState`, `LoadingState`, `StatusBadge`, `AppearancePicker`, and the primitives `Button`, `Input`, `Checkbox`, `DropdownMenu`, `Popover`, `Skeleton`, `AlertDialog` and `Drawer`.
- **The app's own layer, `ui-app/`.** The shadcn components the library does not have (`primitives/`), the signed-in frame (`shell/AppFrame.tsx`), and the two `TableController`s for the library `DataTable` (`table/`: `paginatedController` over `usePaginatedQuery`, `useLocalTable` for rows already in hand).
- **A Storybook with gates.** `npm run storybook -w apps/web` (Storybook 10, `@storybook/nextjs-vite`). `npm test -w apps/web` renders every story with the a11y addon's WCAG A and AA checks and fails on a violation, and requires a sibling story for every component in `ui-app/`.
- **Astrolift manifests.** Astrolift builds one image per app, so there are three: `astrolift.toml` for the API (`apps/api/Dockerfile`, Postgres, Redis), `apps/web/astrolift.toml` for the web (`apps/web/Dockerfile`, Next.js standalone), and `storybook/` (Dockerfile, nginx, `astrolift.toml`) for the Storybook.
- **Upgrades.** `.github/dependabot.yml` checks npm daily and puts `@calliopelabs/*` releases in their own pull request.

### Rename the product

1. `apps/web/ui-app/product.ts`: set `id` (lowercase slug, also the appearance storage key) and `name`; pick an `accent` (a family accent or the product's own) and a `sidebar` colour, or spread a shipped brand (`astroliftBrand`, `zentinelleBrand`, ...). Edit `NAV` for the app's areas and rows; each row's `key` is its message key in the `nav` namespace.
2. `apps/web/ui-app/shell/AppFrame.tsx`: the brand mark (a lucide icon by default; an `<img>` of the logo works).
3. Replace `boilerworks-app` in `astrolift.toml`, `apps/web/astrolift.toml` and `storybook/astrolift.toml` (`name`, `slug`, `display_name`, `repo`, the managed service names).

### Deploy with Astrolift

```shell
astro app register --project-id <uuid> --source-repo <org>/<repo>
astro app register -f apps/web/astrolift.toml --manifest-path apps/web/astrolift.toml \
  --project-id <uuid> --source-repo <org>/<repo>
astro app register -f storybook/astrolift.toml --manifest-path storybook/astrolift.toml \
  --project-id <uuid> --source-repo <org>/<repo>
astro app secrets create SESSION_SECRET boilerworks-app --stdin   # and the api's other secrets
```

The API builds `apps/api`, the web builds `apps/web`, and the Storybook builds from the repository root, because its workspace install needs the root lockfile. Pushes to `main` deploy through the managed workflow. The browser calls the API directly, so the web's `NEXT_PUBLIC_API_ROOT` is the API's public URL (compiled into the bundle, so a build argument of the web app) and the API's `CORS_ORIGINS` is the web's. Build and check the images locally:

```shell
docker build -t app-api apps/api
docker build -t app-web --build-arg NEXT_PUBLIC_API_ROOT=http://localhost:4000 apps/web
docker build -f storybook/Dockerfile -t app-storybook .
docker run --rm -p 8080:8080 app-storybook        # http://localhost:8080, /healthz answers ok
```

### Add the Storybook to the front door

The front door, [calliopeai/calliope-ux](https://github.com/calliopeai/calliope-ux), composes each app's Storybook as a section. Once the Storybook app is deployed, add an entry to its `catalogs.json` and push:

```json
{
  "id": "boilerworks-app",
  "title": "Boilerworks",
  "group": "web",
  "kind": "storybook",
  "repo": "ConflictHQ/boilerworks-nestjs-nextjs",
  "app": "storybook-boilerworks-app",
  "upstream": "web.conflict-storybook-boilerworks-app.svc.cluster.local:8080"
}
```

`upstream` is `<workload>.conflict-<app slug>.svc.cluster.local:8080`; the workload here is `web`.

---

## Getting Started

```shell
git clone https://github.com/ConflictHQ/boilerworks-nestjs-nextjs.git
cd boilerworks-nestjs-nextjs
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
| API (GraphQL) | http://localhost:8000/graphql                 |
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
docker/         # Docker Compose + dev Dockerfiles
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

Boilerworks is a [CONFLICT](https://weareconflict.com) brand. CONFLICT is a registered trademark of CONFLICT LLC.
