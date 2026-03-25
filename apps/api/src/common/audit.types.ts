import { builder } from "../graphql/builder";

builder.prismaNode("AuditLog", {
  id: { field: "id" },
  fields: (t) => ({
    action: t.exposeString("action"),
    targetType: t.exposeString("targetType", { nullable: true }),
    targetId: t.exposeString("targetId", { nullable: true }),
    payload: t.expose("payload", { type: "JSON", nullable: true }),
    ip: t.exposeString("ip", { nullable: true }),
    timestamp: t.expose("timestamp", { type: "DateTime" }),
    user: t.relation("user", { nullable: true }),
  }),
});
