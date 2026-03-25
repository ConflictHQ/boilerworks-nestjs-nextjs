import { builder } from "../graphql/builder";

builder.prismaNode("User", {
  id: { field: "id" },
  fields: (t) => ({
    email: t.exposeString("email"),
    name: t.exposeString("name"),
    isStaff: t.exposeBoolean("isStaff"),
    isSuperuser: t.exposeBoolean("isSuperuser"),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
