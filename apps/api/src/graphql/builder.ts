import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import RelayPlugin from "@pothos/plugin-relay";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
  };
}>({
  plugins: [PrismaPlugin, RelayPlugin],
  prisma: {
    client: prisma,
    dmmf: Prisma.dmmf,
  },
  relay: {},
});

// Base types
builder.queryType({});
builder.mutationType({});

// DateTime scalar
builder.scalarType("DateTime", {
  serialize: (value) => (value as Date).toISOString(),
  parseValue: (value) => new Date(value as string),
});

// JSON scalar
builder.scalarType("JSON", {
  serialize: (value) => value,
  parseValue: (value) => value,
});
