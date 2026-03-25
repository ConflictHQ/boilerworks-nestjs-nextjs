import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";

// Permission trace step
const PermissionTraceStep = builder.simpleObject("PermissionTraceStep", {
  fields: (t) => ({
    level: t.string(),
    name: t.string(),
    granted: t.boolean(),
    reason: t.string(),
  }),
});

// Permission trace result
const PermissionTrace = builder.simpleObject("PermissionTrace", {
  fields: (t) => ({
    granted: t.boolean(),
    userId: t.string(),
    action: t.string(),
    chain: t.field({ type: [PermissionTraceStep] }),
  }),
});

// Effective permission
const EffectivePermission = builder.simpleObject("EffectivePermission", {
  fields: (t) => ({
    slug: t.string(),
    grantedVia: t.string(),
  }),
});

builder.queryField("permissionDiagnose", (t) =>
  t.field({
    type: PermissionTrace,
    args: {
      userId: t.arg.string({ required: true }),
      action: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "groups.view");

      const user = await ctx.prisma.user.findUnique({
        where: { id: args.userId },
        include: {
          groups: {
            include: {
              group: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return {
          granted: false,
          userId: args.userId,
          action: args.action,
          chain: [{ level: "user", name: args.userId, granted: false, reason: "User not found" }],
        };
      }

      const chain: Array<{ level: string; name: string; granted: boolean; reason: string }> = [];

      // Check superuser
      if (user.isSuperuser) {
        chain.push({ level: "superuser", name: user.email, granted: true, reason: "User is superuser — bypasses all checks" });
        return { granted: true, userId: user.id, action: args.action, chain };
      }

      chain.push({ level: "superuser", name: user.email, granted: false, reason: "User is not superuser" });

      // Check groups
      for (const ug of user.groups) {
        const group = ug.group;
        const hasPerm = group.permissions.some((gp) => gp.permission.slug === args.action);
        chain.push({
          level: "group",
          name: group.name,
          granted: hasPerm,
          reason: hasPerm
            ? `Group "${group.name}" has permission "${args.action}"`
            : `Group "${group.name}" does not have "${args.action}"`,
        });
      }

      const granted = chain.some((step) => step.granted);
      if (!granted && user.groups.length === 0) {
        chain.push({ level: "group", name: "(none)", granted: false, reason: "User is not a member of any group" });
      }

      return { granted, userId: user.id, action: args.action, chain };
    },
  }),
);

builder.queryField("effectivePermissions", (t) =>
  t.field({
    type: [EffectivePermission],
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "groups.view");

      const user = await ctx.prisma.user.findUnique({
        where: { id: args.userId },
        include: {
          groups: {
            include: {
              group: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) return [];

      if (user.isSuperuser) {
        const allPerms = await ctx.prisma.permission.findMany();
        return allPerms.map((p) => ({ slug: p.slug, grantedVia: "superuser" }));
      }

      const result: Array<{ slug: string; grantedVia: string }> = [];
      const seen = new Set<string>();

      for (const ug of user.groups) {
        for (const gp of ug.group.permissions) {
          if (!seen.has(gp.permission.slug)) {
            seen.add(gp.permission.slug);
            result.push({ slug: gp.permission.slug, grantedVia: ug.group.name });
          }
        }
      }

      return result.sort((a, b) => a.slug.localeCompare(b.slug));
    },
  }),
);
