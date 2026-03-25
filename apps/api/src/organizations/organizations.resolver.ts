import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";

import "./organizations.types";

builder.queryField("organizations", (t) =>
  t.prismaField({
    type: ["Organization"],
    resolve: (query, _root, _args, ctx) => {
      requireAuth(ctx);
      return ctx.prisma.organization.findMany({
        ...query,
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      });
    },
  }),
);

builder.queryField("organization", (t) =>
  t.prismaField({
    type: "Organization",
    nullable: true,
    args: { slug: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      return ctx.prisma.organization.findFirst({
        ...query,
        where: { slug: args.slug, deletedAt: null },
      });
    },
  }),
);

builder.mutationField("createOrganization", (t) =>
  t.field({
    type: MutationResult,
    args: {
      name: t.arg.string({ required: true }),
      slug: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      const existing = await ctx.prisma.organization.findUnique({
        where: { slug: args.slug },
      });
      if (existing) return mutationError("slug", "Organization with this slug already exists");

      const org = await ctx.prisma.organization.create({
        data: { name: args.name, slug: args.slug },
      });

      // Creator becomes owner
      await ctx.prisma.organizationMember.create({
        data: { userId: ctx.user!.id, organizationId: org.id, role: "owner" },
      });

      return mutationOk();
    },
  }),
);

builder.mutationField("addOrganizationMember", (t) =>
  t.field({
    type: MutationResult,
    args: {
      organizationId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
      role: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      // Verify caller is admin/owner of this organization
      const callerMembership = await ctx.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.user!.id,
            organizationId: args.organizationId,
          },
        },
      });
      if (!ctx.user!.isSuperuser && (!callerMembership || !["owner", "admin"].includes(callerMembership.role))) {
        return mutationError(null, "Only organization admins or owners can add members");
      }

      try {
        await ctx.prisma.organizationMember.create({
          data: {
            organizationId: args.organizationId,
            userId: args.userId,
            role: args.role ?? "member",
          },
        });
      } catch {
        return mutationError(null, "User already a member or invalid IDs");
      }
      return mutationOk();
    },
  }),
);

builder.mutationField("removeOrganizationMember", (t) =>
  t.field({
    type: MutationResult,
    args: {
      organizationId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      // Verify caller is admin/owner of this organization
      const callerMembership = await ctx.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.user!.id,
            organizationId: args.organizationId,
          },
        },
      });
      if (!ctx.user!.isSuperuser && (!callerMembership || !["owner", "admin"].includes(callerMembership.role))) {
        return mutationError(null, "Only organization admins or owners can remove members");
      }

      await ctx.prisma.organizationMember.deleteMany({
        where: {
          organizationId: args.organizationId,
          userId: args.userId,
        },
      });
      return mutationOk();
    },
  }),
);
