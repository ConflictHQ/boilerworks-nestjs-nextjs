import { builder } from "../graphql/builder";

builder.prismaNode("ApiKey", {
  id: { field: "id" },
  fields: (t) => ({
    name: t.exposeString("name"),
    keyPrefix: t.exposeString("keyPrefix"),
    permissions: t.expose("permissions", { type: "JSON" }),
    lastUsedAt: t.expose("lastUsedAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    createdBy: t.relation("createdBy"),
  }),
});
