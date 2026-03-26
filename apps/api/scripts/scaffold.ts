#!/usr/bin/env tsx
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const [, , type, ...rest] = process.argv;
const nameArg = rest.find((a) => a.startsWith("--name="));
const name = nameArg?.split("=")[1];

if (!type || !name) {
  console.log("Usage: npx tsx scripts/scaffold.ts module --name=<name>");
  console.log("       npx tsx scripts/scaffold.ts module --name=invoices");
  process.exit(1);
}

const pascal = name.charAt(0).toUpperCase() + name.slice(1);
const singular = name.endsWith("s") ? name.slice(0, -1) : name;
const singularPascal = singular.charAt(0).toUpperCase() + singular.slice(1);

function scaffold() {
  const apiSrc = join(__dirname, "..", "src");
  const webRoot = join(__dirname, "..", "..", "web");

  // --- API module ---
  const moduleDir = join(apiSrc, name);
  if (existsSync(moduleDir)) {
    console.error(`Directory ${name} already exists in src/`);
    process.exit(1);
  }

  mkdirSync(moduleDir, { recursive: true });

  // module.ts
  writeFileSync(
    join(moduleDir, `${name}.module.ts`),
    `import { Module } from "@nestjs/common";
import { ${pascal}Service } from "./${name}.service";

@Module({
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`,
  );

  // service.ts
  writeFileSync(
    join(moduleDir, `${name}.service.ts`),
    `import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ${pascal}Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // TODO: implement
    return [];
  }

  async findById(id: string) {
    // TODO: implement
    return null;
  }
}
`,
  );

  // types.ts
  writeFileSync(
    join(moduleDir, `${name}.types.ts`),
    `import { builder } from "../graphql/builder";

// TODO: Define Pothos type for ${singularPascal}
// builder.prismaObject("${singularPascal}", {
//   fields: (t) => ({
//     id: t.exposeID("id"),
//   }),
// });
`,
  );

  // resolver.ts
  writeFileSync(
    join(moduleDir, `${name}.resolver.ts`),
    `import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";

// Import types (side-effect)
import "./${name}.types";

// TODO: Add queries
// builder.queryField("${name}", (t) =>
//   t.prismaField({
//     type: ["${singularPascal}"],
//     resolve: (query, _root, _args, ctx) => {
//       requireAuth(ctx);
//       requirePermission(ctx, "${name}.view");
//       return ctx.prisma.${singular}.findMany({ ...query });
//     },
//   }),
// );
`,
  );

  // spec.ts
  writeFileSync(
    join(moduleDir, `${name}.spec.ts`),
    `import { describe, it, expect } from "vitest";

describe("${pascal}", () => {
  it("should be defined", () => {
    expect(true).toBe(true);
  });

  // TODO: Add integration tests
  // - CRUD operations via GraphQL
  // - Permission checks (allowed + denied)
  // - Soft delete behavior
});
`,
  );

  console.log(`✓ API module: src/${name}/`);
  console.log(`    ${name}.module.ts`);
  console.log(`    ${name}.service.ts`);
  console.log(`    ${name}.types.ts`);
  console.log(`    ${name}.resolver.ts`);
  console.log(`    ${name}.spec.ts`);

  // --- Frontend GraphQL ---
  const gqlDir = join(webRoot, "graphql", name);
  mkdirSync(gqlDir, { recursive: true });

  writeFileSync(
    join(gqlDir, `${name}.types.ts`),
    `export type ${singularPascal} = {
  id: string;
  // TODO: add fields
};

export type ${pascal}Data = {
  ${name}: ${singularPascal}[];
};
`,
  );

  writeFileSync(
    join(gqlDir, `${name}.queries.ts`),
    `import { gql } from "@apollo/client";

export const GET_${name.toUpperCase()} = gql\`
  query Get${pascal} {
    ${name} {
      id
    }
  }
\`;
`,
  );

  writeFileSync(
    join(gqlDir, `${name}.mutations.ts`),
    `import { gql } from "@apollo/client";

// TODO: Add mutations
`,
  );

  writeFileSync(
    join(gqlDir, `${name}.hooks.ts`),
    `import { useQuery } from "@apollo/client/react";
import { GET_${name.toUpperCase()} } from "./${name}.queries";
import type { ${pascal}Data } from "./${name}.types";

export const use${pascal} = () => {
  const { data, loading, error, refetch } = useQuery<${pascal}Data>(GET_${name.toUpperCase()}, {
    fetchPolicy: "cache-and-network",
  });
  return { ${name}: data?.${name} ?? [], loading, error, refetch };
};
`,
  );

  console.log(`✓ Frontend GraphQL: graphql/${name}/`);
  console.log(`    ${name}.types.ts`);
  console.log(`    ${name}.queries.ts`);
  console.log(`    ${name}.mutations.ts`);
  console.log(`    ${name}.hooks.ts`);

  // --- Frontend page ---
  const pageDir = join(webRoot, "app", "(app)", name);
  mkdirSync(pageDir, { recursive: true });

  writeFileSync(
    join(pageDir, "page.tsx"),
    `export default function ${pascal}Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">${pascal}</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage ${name}.</p>
      </div>
    </div>
  );
}
`,
  );

  console.log(`✓ Frontend page: app/(app)/${name}/page.tsx`);
  console.log("");
  console.log("Next steps:");
  console.log(
    `  1. Add Prisma model for ${singularPascal} to prisma/schema.prisma`,
  );
  console.log(`  2. Run: npx prisma migrate dev --name add_${name}`);
  console.log(
    `  3. Uncomment and fill in ${name}.types.ts and ${name}.resolver.ts`,
  );
  console.log(`  4. Import resolver in src/graphql/schema.ts`);
  console.log(`  5. Add nav item in apps/web/components/AppSidebar.tsx`);
}

scaffold();
