import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";

const FormAnalytics = builder.simpleObject("FormAnalytics", {
  fields: (t) => ({
    totalSubmissions: t.int(),
    submissionsToday: t.int(),
    submissionsThisWeek: t.int(),
    submissionsThisMonth: t.int(),
    averagePerDay: t.float(),
  }),
});

builder.queryField("formAnalytics", (t) =>
  t.field({
    type: FormAnalytics,
    args: {
      formId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "forms.view");

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [total, today, week, month] = await Promise.all([
        ctx.prisma.formSubmission.count({ where: { formId: args.formId } }),
        ctx.prisma.formSubmission.count({
          where: { formId: args.formId, submittedAt: { gte: startOfDay } },
        }),
        ctx.prisma.formSubmission.count({
          where: { formId: args.formId, submittedAt: { gte: startOfWeek } },
        }),
        ctx.prisma.formSubmission.count({
          where: { formId: args.formId, submittedAt: { gte: startOfMonth } },
        }),
      ]);

      // Calculate average per day (over last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const last30 = await ctx.prisma.formSubmission.count({
        where: { formId: args.formId, submittedAt: { gte: thirtyDaysAgo } },
      });

      return {
        totalSubmissions: total,
        submissionsToday: today,
        submissionsThisWeek: week,
        submissionsThisMonth: month,
        averagePerDay: Math.round((last30 / 30) * 100) / 100,
      };
    },
  }),
);
