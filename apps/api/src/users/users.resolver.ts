import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
import { randomBytes, scryptSync } from "crypto";

// Import types (side-effect)
import "./users.types";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

builder.queryField("me", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    resolve: (query, _root, _args, ctx) => {
      if (!ctx.user) return null;
      return ctx.prisma.user.findUnique({
        ...query,
        where: { id: ctx.user.id },
      });
    },
  }),
);

builder.queryField("users", (t) =>
  t.prismaField({
    type: ["User"],
    resolve: (query, _root, _args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "users.view");
      return ctx.prisma.user.findMany({
        ...query,
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    },
  }),
);

builder.queryField("user", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "users.view");
      return ctx.prisma.user.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  }),
);

// --- Mutations ---

builder.mutationField("createUser", (t) =>
  t.field({
    type: MutationResult,
    args: {
      email: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "users.create");

      const existing = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (existing) return mutationError("email", "Email already in use");

      await ctx.prisma.user.create({
        data: {
          email: args.email,
          name: args.name,
          passwordHash: hashPassword(args.password),
        },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("updateUser", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      email: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "users.edit");

      const data: Record<string, unknown> = {};
      if (args.name !== undefined && args.name !== null) data.name = args.name;
      if (args.email !== undefined && args.email !== null) data.email = args.email;

      try {
        await ctx.prisma.user.update({
          where: { id: args.id },
          data,
        });
      } catch {
        return mutationError(null, "User not found or email conflict");
      }
      return mutationOk();
    },
  }),
);

builder.mutationField("deleteUser", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "users.delete");

      // Soft delete — deactivate, don't remove
      await ctx.prisma.user.update({
        where: { id: args.id },
        data: { isActive: false },
      });
      return mutationOk();
    },
  }),
);
