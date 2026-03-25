import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "./guards/auth";

import "./audit.types";

builder.queryField("auditLogs", (t) =>
  t.prismaField({
    type: ["AuditLog"],
    args: {
      userId: t.arg.string({ required: false }),
      action: t.arg.string({ required: false }),
      targetType: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "audit.view");

      const where: Record<string, unknown> = {};
      if (args.userId) where.userId = args.userId;
      if (args.action) where.action = args.action;
      if (args.targetType) where.targetType = args.targetType;

      return ctx.prisma.auditLog.findMany({
        ...query,
        where,
        orderBy: { timestamp: "desc" },
        take: args.limit ?? 100,
      });
    },
  }),
);
