import { builder } from "../graphql/builder";

builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name"),
    isStaff: t.exposeBoolean("isStaff"),
    isSuperuser: t.exposeBoolean("isSuperuser"),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
