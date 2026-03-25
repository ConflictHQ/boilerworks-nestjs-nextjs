import { builder } from "../graphql/builder";

builder.prismaObject("Organization", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    settings: t.expose("settings", { type: "JSON" }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    members: t.relation("members"),
    memberCount: t.relationCount("members"),
  }),
});

builder.prismaObject("OrganizationMember", {
  fields: (t) => ({
    id: t.exposeID("id"),
    role: t.exposeString("role"),
    joinedAt: t.expose("joinedAt", { type: "DateTime" }),
    user: t.relation("user"),
    organization: t.relation("organization"),
  }),
});
