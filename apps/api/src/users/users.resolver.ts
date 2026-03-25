import { builder } from "../graphql/builder";
import { requireAuth } from "../common/guards/auth";

// Import types (side-effect)
import "./users.types";

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
      return ctx.prisma.user.findMany({
        ...query,
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    },
  }),
);
