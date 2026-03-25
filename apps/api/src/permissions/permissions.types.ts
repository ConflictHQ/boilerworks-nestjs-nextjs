import { builder } from "../graphql/builder";

builder.prismaNode("Permission", {
  id: { field: "id" },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    name: t.exposeString("name"),
  }),
});

builder.prismaNode("Group", {
  id: { field: "id" },
  fields: (t) => ({
    name: t.exposeString("name"),
    permissions: t.relation("permissions"),
    users: t.relation("users"),
  }),
});

builder.prismaObject("GroupPermission", {
  fields: (t) => ({
    permission: t.relation("permission"),
    group: t.relation("group"),
  }),
});

builder.prismaObject("UserGroup", {
  fields: (t) => ({
    user: t.relation("user"),
    group: t.relation("group"),
  }),
});
