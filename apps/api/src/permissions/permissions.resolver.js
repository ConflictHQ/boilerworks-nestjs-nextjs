import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
// Import types (side-effect)
import "./permissions.types";
// --- Queries ---
builder.queryField("permissions", (t) => t.prismaField({
    type: ["Permission"],
    resolve: (query, _root, _args, ctx) => {
        requireAuth(ctx);
        return ctx.prisma.permission.findMany({
            ...query,
            orderBy: { slug: "asc" },
        });
    },
}));
builder.queryField("groups", (t) => t.prismaField({
    type: ["Group"],
    resolve: (query, _root, _args, ctx) => {
        requireAuth(ctx);
        return ctx.prisma.group.findMany({
            ...query,
            orderBy: { name: "asc" },
        });
    },
}));
// --- Mutations ---
builder.mutationField("createGroup", (t) => t.field({
    type: MutationResult,
    args: {
        name: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
        requirePermission(ctx, "groups.create");
        const existing = await ctx.prisma.group.findUnique({
            where: { name: args.name },
        });
        if (existing)
            return mutationError("name", "Group already exists");
        await ctx.prisma.group.create({ data: { name: args.name } });
        return mutationOk();
    },
}));
builder.mutationField("assignUserToGroup", (t) => t.field({
    type: MutationResult,
    args: {
        userId: t.arg.string({ required: true }),
        groupId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
        requirePermission(ctx, "groups.edit");
        try {
            await ctx.prisma.userGroup.create({
                data: { userId: args.userId, groupId: args.groupId },
            });
        }
        catch {
            return mutationError(null, "Assignment already exists or invalid IDs");
        }
        return mutationOk();
    },
}));
builder.mutationField("removeUserFromGroup", (t) => t.field({
    type: MutationResult,
    args: {
        userId: t.arg.string({ required: true }),
        groupId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
        requirePermission(ctx, "groups.edit");
        await ctx.prisma.userGroup.deleteMany({
            where: { userId: args.userId, groupId: args.groupId },
        });
        return mutationOk();
    },
}));
builder.mutationField("assignPermissionToGroup", (t) => t.field({
    type: MutationResult,
    args: {
        groupId: t.arg.string({ required: true }),
        permissionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
        requirePermission(ctx, "groups.edit");
        try {
            await ctx.prisma.groupPermission.create({
                data: { groupId: args.groupId, permissionId: args.permissionId },
            });
        }
        catch {
            return mutationError(null, "Assignment already exists or invalid IDs");
        }
        return mutationOk();
    },
}));
builder.mutationField("removePermissionFromGroup", (t) => t.field({
    type: MutationResult,
    args: {
        groupId: t.arg.string({ required: true }),
        permissionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
        requirePermission(ctx, "groups.edit");
        await ctx.prisma.groupPermission.deleteMany({
            where: { groupId: args.groupId, permissionId: args.permissionId },
        });
        return mutationOk();
    },
}));
//# sourceMappingURL=permissions.resolver.js.map