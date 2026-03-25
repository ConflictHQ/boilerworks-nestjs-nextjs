import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import RelayPlugin from "@pothos/plugin-relay";
import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const builder = new SchemaBuilder({
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
    serialize: (value) => value.toISOString(),
    parseValue: (value) => new Date(value),
});
// JSON scalar
builder.scalarType("JSON", {
    serialize: (value) => value,
    parseValue: (value) => value,
});
//# sourceMappingURL=builder.js.map