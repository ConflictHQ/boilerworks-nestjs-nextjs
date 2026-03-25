import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk } from "../graphql/types";

import "./notifications.types";

builder.queryField("notifications", (t) =>
  t.prismaField({
    type: ["Notification"],
    resolve: (query, _root, _args, ctx) => {
      requireAuth(ctx);
      return ctx.prisma.notification.findMany({
        ...query,
        where: { userId: ctx.user!.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },
  }),
);

builder.queryField("unreadNotificationCount", (t) =>
  t.int({
    resolve: async (_root, _args, ctx) => {
      requireAuth(ctx);
      return ctx.prisma.notification.count({
        where: { userId: ctx.user!.id, isRead: false },
      });
    },
  }),
);

builder.mutationField("markNotificationRead", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      await ctx.prisma.notification.update({
        where: { id: args.id },
        data: { isRead: true },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("markAllNotificationsRead", (t) =>
  t.field({
    type: MutationResult,
    resolve: async (_root, _args, ctx) => {
      requireAuth(ctx);
      await ctx.prisma.notification.updateMany({
        where: { userId: ctx.user!.id, isRead: false },
        data: { isRead: true },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("createNotification", (t) =>
  t.field({
    type: MutationResult,
    args: {
      userId: t.arg.string({ required: true }),
      subject: t.arg.string({ required: true }),
      message: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "notifications.view");
      await ctx.prisma.notification.create({
        data: {
          userId: args.userId,
          subject: args.subject,
          message: args.message,
        },
      });
      return mutationOk();
    },
  }),
);
