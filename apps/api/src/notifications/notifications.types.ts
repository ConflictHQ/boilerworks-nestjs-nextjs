import { builder } from "../graphql/builder";

builder.prismaObject("Notification", {
  fields: (t) => ({
    id: t.exposeID("id"),
    subject: t.exposeString("subject"),
    message: t.exposeString("message"),
    isRead: t.exposeBoolean("isRead"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    user: t.relation("user"),
  }),
});
