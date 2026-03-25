# Contributing to Boilerworks TS

Thanks for your interest in contributing. This document covers everything you need to get started.

---

## Getting started

**Requirements:** Docker Desktop + Node.js 20+

```shell
git clone https://github.com/ConflictHQ/boilerworks-ts.git
cd boilerworks-ts
cp local.env.example local.env   # Edit with your Auth0 credentials
npm install
./run.sh up                       # Starts Docker + runs migrations
./run.sh seed                     # Loads dev fixtures
```

Or manually:
```shell
docker compose -f docker/docker-compose.yaml up -d
cd apps/api && npx prisma migrate dev && npx tsx prisma/seed.ts
```

Read [`bootstrap.md`](bootstrap.md) before writing any code.

---

## Making changes

### Branching

```
main          — stable, always deployable
feature/...   — new features
fix/...       — bug fixes
chore/...     — tooling, deps, docs
```

Open a PR against `main`.

### Code style

Prettier + ESLint enforce all formatting and linting rules.

```shell
npm run format        # fix formatting
npm run format:check  # check formatting (CI)
npm run lint          # lint all packages
```

### Tests

```shell
npm run test          # run all tests
```

All new features and bug fixes need tests. Assert against database state, not hardcoded strings.

### Database changes

If you change the Prisma schema, create a migration:

```shell
cd apps/api
npx prisma migrate dev --name describe_your_change
```

---

## Pull requests

- Keep PRs focused — one feature or fix per PR
- Include tests
- Run `npm run lint` before opening
- Fill in the PR template
- Reference related issues with `Closes #123`

---

## Reporting issues

Use the [issue templates](.github/ISSUE_TEMPLATE/) — bug reports and feature requests have separate forms.

---

## Questions

Open a [GitHub Discussion](https://github.com/ConflictHQ/boilerworks-ts/discussions) for questions, ideas, or general feedback.
