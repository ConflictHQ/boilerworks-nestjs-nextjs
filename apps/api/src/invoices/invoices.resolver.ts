import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";

// Import types (side-effect)
import "./invoices.types";

// TODO: Add queries
// builder.queryField("invoices", (t) =>
//   t.prismaField({
//     type: ["Invoice"],
//     resolve: (query, _root, _args, ctx) => {
//       requireAuth(ctx);
//       requirePermission(ctx, "invoices.view");
//       return ctx.prisma.invoice.findMany({ ...query });
//     },
//   }),
// );
