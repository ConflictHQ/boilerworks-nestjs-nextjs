import { builder } from "../graphql/builder";

builder.prismaNode("Notification", {
  id: { field: "id" },
  fields: (t) => ({
    subject: t.exposeString("subject"),
    message: t.exposeString("message"),
    isRead: t.exposeBoolean("isRead"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    user: t.relation("user"),
  }),
});
