# Boilerworks TS — Bootstrap

Primary conventions document for the Boilerworks TypeScript platform. All agent shims (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) point here.

An agent given this document and a business requirement should be able to generate correct, idiomatic code without exploring the codebase.

---

## What's Already Built

| Layer | What's there |
|---|---|
| Auth | Session-based auth (httpOnly cookies), login/logout, rate limiting on auth endpoints |
| Data | Postgres 16, Prisma ORM, `cuid()` IDs, `createdAt`/`updatedAt` on all models, soft deletes via `deletedAt` |
| API | GraphQL (Pothos + Prisma plugin + Relay plugin), GraphQL Yoga server |
| Permissions | Group-based RBAC (User → UserGroup → Group → GroupPermission → Permission), guard decorator |
| Async | BullMQ workers, Redis broker, Bull Board monitoring |
| Search | MeiliSearch or Typesense (planned) |
| Email | Nodemailer (prod), Mailpit (local) |
| Feature flags | Env-based feature toggles (`config/features.ts`) |
| Admin | AdminJS or Prisma Studio for CRUD |
| Forms engine | FormDefinition (versioned JSON Schema), FormSubmission, 21+ field types, logic engine |
| Workflow engine | WorkflowDefinition (JSON state machine), WorkflowInstance, TransitionLog, conditions + actions |
| Uploads | S3/MinIO presigned URLs, Upload model |
| Notifications | In-app notifications, email delivery |
| Audit | AuditLog model for mutation tracking |
| Infra | Docker Compose: postgres, redis, minio, mailpit, api, web, worker |
| Frontend | Next.js 16 (App Router), Apollo Client, shadcn/ui, Tailwind CSS, Recharts, i18n, dark mode |
| CI | GitHub Actions: lint + test (planned) |

---

## Monorepo Structure

```
boilerworks-ts/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── app.module.ts   # Root module — registers all feature modules
│   │   │   ├── main.ts         # Entry point — GraphQL Yoga + NestJS
│   │   │   ├── common/         # Guards, decorators, pipes, filters
│   │   │   ├── auth/           # Auth module
│   │   │   ├── users/          # User module
│   │   │   ├── forms/          # Forms engine module
│   │   │   ├── workflows/      # Workflow engine module
│   │   │   ├── permissions/    # RBAC module
│   │   │   ├── uploads/        # File upload module
│   │   │   ├── notifications/  # Notification module
│   │   │   ├── jobs/           # BullMQ processors
│   │   │   └── graphql/        # Pothos schema assembly
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Prisma migrations
│   │   │   └── seed.ts         # Dev seed data
│   │   └── test/
│   │
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── (app)/          # Authenticated routes (auth gate in layout.tsx)
│       │   └── (login)/        # Public routes (login, callback)
│       ├── components/         # UI components
│       ├── graphql/            # Queries, mutations, hooks, types per domain
│       ├── hooks/              # Utility hooks
│       └── lib/                # Apollo client, auth, permissions, utils
│
├── packages/
│   └── shared/                 # Types shared between api and web
│
├── docker/
│   └── docker-compose.yaml
│
├── bootstrap.md                # ← You are here
├── CLAUDE.md                   # Claude agent shim → points here
├── turbo.json                  # Turborepo config
└── package.json                # Root workspace
```

---

## Module Structure

Every domain follows the same NestJS module pattern:

```
apps/api/src/invoices/
  invoices.module.ts      # @Module — imports, providers, exports
  invoices.service.ts     # Business logic — Prisma queries, validation
  invoices.resolver.ts    # GraphQL resolvers (registered in graphql/schema.ts)
  invoices.types.ts       # Pothos type definitions
  invoices.spec.ts        # Tests (Vitest)
```

Register the module in `app.module.ts`:
```typescript
@Module({
  imports: [..., InvoicesModule],
})
export class AppModule {}
```

Register types in `graphql/schema.ts`:
```typescript
import "./invoices/invoices.types";  // side-effect import registers types
```

### Frontend structure (per domain)

```
apps/web/graphql/invoices/
  invoices.types.ts       # TypeScript types mirroring GraphQL schema
  invoices.queries.ts     # gql query constants (SCREAMING_SNAKE)
  invoices.mutations.ts   # gql mutation constants
  invoices.hooks.ts       # React hooks: useInvoices(), useCreateInvoice()

apps/web/app/(app)/invoices/
  page.tsx                # List page
  [id]/page.tsx           # Detail page
  new/page.tsx            # Create page
```

Add to sidebar in `components/AppSidebar.tsx`. Add route label in `lib/routes.ts`.

---

## Conventions

### Prisma Models

All models use `cuid()` IDs. Never expose raw integer IDs.

```prisma
model Invoice {
  id          String   @id @default(cuid())
  name        String
  amount      Decimal
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?           // soft delete
  createdById String?
  updatedById String?
}
```

**Rules:**
- Every model has `id`, `createdAt`, `updatedAt`
- Business models add `deletedAt` for soft deletes — never call `prisma.model.delete()`
- Use `@@index` for any field used in filters or joins
- Use `@@unique` for natural keys (e.g., `[slug, version]`)
- Relations always specify `onDelete` behavior

**Soft deletes:** Use Prisma middleware to filter `deletedAt IS NULL` globally:
```typescript
prisma.$use(async (params, next) => {
  if (params.action === "findMany" || params.action === "findFirst") {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  return next(params);
});
```

---

### GraphQL (Pothos)

**Schema builder** (`graphql/schema.ts`):
```typescript
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import RelayPlugin from "@pothos/plugin-relay";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: GraphQLContext;
}>({
  plugins: [PrismaPlugin, RelayPlugin],
  prisma: { client: prisma },
});
```

**Types** — auto-mapped from Prisma:
```typescript
builder.prismaObject("Invoice", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    amount: t.exposeFloat("amount"),
    status: t.exposeString("status"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    submissions: t.relation("submissions"),
    submissionCount: t.relationCount("submissions"),
  }),
});
```

**Queries:**
```typescript
builder.queryField("invoices", (t) =>
  t.prismaField({
    type: ["Invoice"],
    args: { status: t.arg.string({ required: false }) },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      return ctx.prisma.invoice.findMany({
        ...query,
        where: args.status ? { status: args.status } : {},
        orderBy: { createdAt: "desc" },
      });
    },
  })
);
```

**Mutations — always return MutationResult:**
```typescript
const MutationResult = builder.simpleObject("MutationResult", {
  fields: (t) => ({
    ok: t.boolean(),
    errors: t.field({ type: [MutationError], nullable: true }),
  }),
});

builder.mutationField("createInvoice", (t) =>
  t.field({
    type: MutationResult,
    args: {
      name: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "invoices.create");
      await ctx.prisma.invoice.create({
        data: { ...args, createdById: ctx.user!.id },
      });
      return { ok: true, errors: null };
    },
  })
);
```

**Context** (`graphql/context.ts`):
```typescript
export type GraphQLContext = {
  user: User | null;
  session: Session | null;
  prisma: PrismaClient;
  req: Request;
};
```

**Auth check at the top of every resolver and mutation.** No exceptions:
```typescript
function requireAuth(ctx: GraphQLContext): asserts ctx is GraphQLContext & { user: User } {
  if (!ctx.user) throw new GraphQLError("Authentication required");
}
```

---

### Services

Business logic lives in services, not resolvers. Resolvers are thin:

```typescript
@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.invoice.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateInvoiceInput, userId: string) {
    return this.prisma.invoice.create({
      data: { ...data, createdById: userId },
    });
  }

  async softDelete(id: string, userId: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
  }
}
```

---

### Permissions

Group-based. Never assign directly to users.

**Define:**
```typescript
// permissions/roles.enum.ts
export enum P {
  INVOICE_VIEW = "invoices.view",
  INVOICE_CREATE = "invoices.create",
  INVOICE_EDIT = "invoices.edit",
  INVOICE_DELETE = "invoices.delete",
}
```

**Check in resolver:**
```typescript
function requirePermission(ctx: GraphQLContext, slug: string) {
  if (ctx.user?.isSuperuser) return;
  // Check GroupPermission table
  // Throw GraphQLError("Permission denied") if not found
}
```

**NestJS guard (for REST endpoints):**
```typescript
@RequirePermission(P.INVOICE_VIEW)
@Query(() => [InvoiceType])
async invoices(@Ctx() ctx: GraphQLContext) { ... }
```

**Frontend guard:**
```tsx
// Server Component
await requirePermission(PermissionSlug.InvoiceView);

// Client Component
<PermissionGuard permission={PermissionSlug.InvoiceView}>
  <InvoiceList />
</PermissionGuard>
```

---

### Auth

Auth0 for identity + backend session for API auth. httpOnly cookies. No JWT stored client-side.

**Login flow:**
1. Frontend redirects to Auth0 universal login
2. Auth0 callback hits backend with authorization code
3. Backend exchanges code for Auth0 tokens (id_token + access_token)
4. Backend creates local Session, sets httpOnly cookie with backend JWT
5. Frontend uses cookie for all subsequent GraphQL requests

```typescript
// auth/auth.service.ts
async handleCallback(code: string): Promise<Session> {
  const auth0Tokens = await this.exchangeCode(code);
  const user = await this.findOrCreateUser(auth0Tokens);
  return this.createSession(user.id);
}

async createSession(userId: string): Promise<Session> {
  const token = randomBytes(32).toString("hex");
  return this.prisma.session.create({
    data: { userId, token, expiresAt: addDays(new Date(), 30) },
  });
}

async validateSession(token: string): Promise<User | null> {
  const session = await this.prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}
```

**Auth0 env vars** (shared with Django edition — same Auth0 tenant):
```
AUTH0_DOMAIN=conflict.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_CLIENT_SCOPES="openid profile email read:users create:users update:users"
AUTH0_DATABASE_CONNECTION_ID="Username-Password-Authentication"
```

**Frontend auth gate** (`app/(app)/layout.tsx`):
```typescript
// Server Component — checks for session cookie
// If no cookie → redirect to /auth/login
// If cookie → fetch user via GraphQL → render children
```

---

### BullMQ Jobs

Tasks live in `jobs/` directory. One processor per queue:

```typescript
@Processor("workflow-actions")
export class WorkflowActionProcessor {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  @Process("execute")
  async handleAction(job: Job<WorkflowActionData>) {
    const { action, instanceId, fromState, toState, userId } = job.data;

    switch (action.type) {
      case "notify_user":
        await this.createNotification(action);
        break;
      case "send_email":
        await this.email.send(action.to, action.subject, action.message);
        break;
      case "call_webhook":
        await fetch(action.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instanceId, fromState, toState, userId }),
        });
        break;
      case "update_field":
        // Polymorphic field update
        break;
    }
  }
}
```

**Retryable jobs:**
```typescript
await this.queue.add("execute", payload, {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
});
```

---

### Frontend Hooks

```typescript
// Arrow functions, explicit types, explicit fetchPolicy
export const useInvoices = () => {
  const { data, loading, error } = useQuery<InvoicesData>(GET_INVOICES, {
    fetchPolicy: "cache-and-network",
  });
  return { invoices: data?.invoices ?? [], loading, error };
};

export const useCreateInvoice = () =>
  useMutation<CreateInvoiceData>(CREATE_INVOICE, {
    refetchQueries: [GET_INVOICES],
  });
```

**Rules:**
- Always set `fetchPolicy` explicitly
- Always type parameters on `useQuery`/`useMutation`
- For `cache-and-network`, gate loading on `loading && !data` to avoid spinners during background refetch
- Never `useQuery` in Server Components — use `getClient().query()` instead
- Hooks in `graphql/<domain>/<domain>.hooks.ts`

---

### Forms Engine

JSON Schema definitions rendered at runtime. No code changes to add a new form.

**Backend:** `FormDefinition` model stores versioned JSON Schema. `field-types.ts` defines 21+ types. `logic-engine.ts` evaluates conditional rules (show/hide/require/calculate). Validation via Ajv.

**Frontend:** `DynamicForm` reads schema → `field-registry.tsx` maps types to widgets → React Hook Form manages state.

**Field types:** text, textarea, number, integer, boolean, date, datetime, time, email, url, select, multi_select, radio, file, signature, rating, scale, pin, text_block, section_header, page_break, image, percentage_split, repeatable, user_lookup

**Visual builders:**
- AdminJS/custom: visual field editor
- Next.js: `FormBuilder` component (@dnd-kit, live preview, per-type config)

---

### Workflow Engine

JSON-defined state machines attached to any model via `targetModel` + `targetId`.

**State:** `{name, label, is_initial, is_final, color, form_slug?, assigned_role?}`
**Transition:** `{from_state, to_state, label, conditions[], actions[]}`

**Condition types:** `user_has_role`, `field_equals`, `field_in`, `is_authenticated`, `is_superuser`
**Action types:** `notify_user`, `send_email`, `call_webhook`, `update_field`

**Service pattern:**
```typescript
// Start workflow
const instance = await workflowService.start(workflow, targetModel, targetId, user);

// Transition
await workflowService.transition(instanceId, "approved", user, "Looks good");

// Check available transitions
const available = await workflowService.getAvailableTransitions(instanceId, user);
```

**Actions execute via BullMQ** — fire-and-forget with configurable retries.

**Visual builder:** Next.js `WorkflowBuilder` (ReactFlow canvas, click-to-edit panels, conditions/actions editors, form picker, role assignment via TagInput).

---

### Feature Toggles

```typescript
// config/features.ts
export const features = {
  forms: env.bool("FEATURE_FORMS", true),
  workflows: env.bool("FEATURE_WORKFLOWS", true),
  temporal: env.bool("FEATURE_TEMPORAL", false),
  search: env.bool("FEATURE_SEARCH", false),
};
```

Conditionally register modules in `app.module.ts`:
```typescript
@Module({
  imports: [
    AuthModule,
    UsersModule,
    ...(features.forms ? [FormsModule] : []),
    ...(features.workflows ? [WorkflowsModule] : []),
  ],
})
```

---

### Validation

Use **Zod** at API boundaries:
```typescript
const CreateInvoiceSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
});

// In resolver
const parsed = CreateInvoiceSchema.parse(args);
```

Use **Ajv** for JSON Schema validation (forms engine):
```typescript
const ajv = new Ajv();
const validate = ajv.compile(formDefinition.schema);
if (!validate(payload)) {
  return { ok: false, errors: formatAjvErrors(validate.errors) };
}
```

---

### Tests

```typescript
// Vitest + Supertest
describe("createInvoice", () => {
  it("creates and persists an invoice", async () => {
    const res = await request(app.getHttpServer())
      .post("/graphql")
      .set("Cookie", `session_token=${testSession.token}`)
      .send({
        query: `mutation { createInvoice(name: "Test", amount: 100) { ok } }`,
      });

    expect(res.body.data.createInvoice.ok).toBe(true);

    // Assert against database — not hardcoded strings
    const invoice = await prisma.invoice.findFirst({
      where: { name: "Test" },
    });
    expect(invoice).toBeTruthy();
    expect(invoice!.amount).toBe(100);
    expect(invoice!.createdById).toBe(testUser.id);
  });

  it("denies unauthenticated access", async () => {
    const res = await request(app.getHttpServer())
      .post("/graphql")
      .send({
        query: `mutation { createInvoice(name: "Test", amount: 100) { ok } }`,
      });

    expect(res.body.errors[0].message).toContain("Authentication");
  });
});
```

**Rules:**
- Assert against database state, not hardcoded strings
- No empty test bodies
- Test both allowed and denied permission cases
- Use real database (Prisma test utilities), not mocks

---

### Code Style

- **Prettier** for formatting (with `prettier-plugin-tailwindcss`)
- **ESLint** with `@typescript-eslint` for linting
- **Strict TypeScript:** `strict: true`, `noImplicitAny: true`
- Max line length: managed by Prettier (default 100)
- Imports sorted by ESLint import plugin
- Husky + lint-staged for pre-commit hooks

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
npm run lint          # Lint all files
npm run test          # Run tests
```

---

### Dataloaders

Prevent N+1 queries in GraphQL resolvers. One dataloader per batched relation:

```typescript
// graphql/dataloaders.ts
import DataLoader from "dataloader";

export const createDataloaders = (prisma: PrismaClient) => ({
  userById: new DataLoader<string, User | null>(async (ids) => {
    const users = await prisma.user.findMany({ where: { id: { in: [...ids] } } });
    const map = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => map.get(id) ?? null);
  }),
});
```

**Rules:**
- Create in `graphql/dataloaders.ts`, attach to context per-request
- Key by ID (string), return in same order as input
- Never share dataloaders across requests — they cache per-request only

---

### Environment Variables

All env vars validated at startup via Zod (`config/env.ts`). App fails fast on missing config.

**Naming convention:**
- `DATABASE_URL` — Postgres connection string
- `REDIS_URL` — Redis connection string
- `S3_*` — MinIO/S3 config (ENDPOINT, BUCKET, ACCESS_KEY, SECRET_KEY)
- `SMTP_*` — Email config (HOST, PORT, FROM)
- `FEATURE_*` — Feature flags (boolean)
- `SESSION_SECRET` — Session signing secret (min 32 chars)
- `CORS_ORIGINS` — Comma-separated allowed origins
- `NODE_ENV` — development | production | test

**Files:**
- `.env.example` — documented template (committed)
- `.env` — local overrides (gitignored)
- `.env.test` — test database URL (gitignored)

---

### Security

- **CORS:** Configured in `main.ts`, allowed origins from `CORS_ORIGINS` env var
- **Helmet:** HTTP security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **Cookies:** httpOnly, secure (prod), sameSite: lax
- **Rate limiting:** Per-endpoint, configurable via decorator
- **Input validation:** Zod at API boundaries, Ajv for JSON Schema forms
- **No raw SQL:** Always use Prisma query builder

---

### Branching

```
main          — stable, always deployable
feature/...   — new features
fix/...       — bug fixes
chore/...     — tooling, deps, docs
```

Open PRs against `main`. Keep PRs focused — one feature or fix per PR.

---

## Ports (local)

| Service | URL |
|---|---|
| API (GraphQL) | http://localhost:4000/graphql |
| Frontend | http://localhost:3000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
| MinIO S3 API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Mailpit | http://localhost:8025 |
| Bull Board | http://localhost:4000/admin/queues |

---

## Common Commands

```bash
npm run dev                   # Start all (Turborepo)
npm run build                 # Build all
npm run lint                  # Lint all
npm run test                  # Test all

# API-specific
cd apps/api
npx prisma migrate dev        # Create + apply migration
npx prisma migrate deploy     # Apply migrations (CI/prod)
npx prisma db push            # Push schema without migration (prototyping)
npx prisma studio             # Visual database browser
npx prisma generate           # Regenerate Prisma client
npm run db:seed               # Load dev fixtures

# Docker (or use ./run.sh)
docker compose -f docker/docker-compose.yaml up -d        # Start infra
docker compose -f docker/docker-compose.yaml down          # Stop
docker compose -f docker/docker-compose.yaml logs api -f   # Tail API logs

# run.sh (preferred — local dev command center)
./run.sh up           # Start everything
./run.sh stop         # Stop everything
./run.sh logs         # Tail API logs
./run.sh migrate      # Run Prisma migrations
./run.sh seed         # Load dev fixtures
./run.sh test         # Run test suite
./run.sh lint         # Run linters
./run.sh health       # Check service health
./run.sh help         # See all commands
```

---

## Adding a New Module

```bash
# 1. Create the module directory
mkdir -p apps/api/src/invoices

# 2. Create module, service, resolver, types files (follow pattern above)

# 3. Add Prisma model to schema.prisma
npx prisma migrate dev --name add_invoices

# 4. Register module in app.module.ts

# 5. Register Pothos types in graphql/schema.ts

# 6. Create frontend graphql layer (types, queries, mutations, hooks)

# 7. Create pages under app/(app)/invoices/

# 8. Add to sidebar in AppSidebar.tsx

# 9. Write tests
npm run test
```
