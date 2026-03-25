import { builder } from "../graphql/builder";
builder.prismaObject("Permission", {
    fields: (t) => ({
        id: t.exposeID("id"),
        slug: t.exposeString("slug"),
        name: t.exposeString("name"),
    }),
});
builder.prismaObject("Group", {
    fields: (t) => ({
        id: t.exposeID("id"),
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
//# sourceMappingURL=permissions.types.js.map