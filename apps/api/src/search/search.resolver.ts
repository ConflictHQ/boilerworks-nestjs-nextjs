import { builder } from "../graphql/builder";
import { requireAuth } from "../common/guards/auth";

const SearchHit = builder.simpleObject("SearchHit", {
  fields: (t) => ({
    id: t.string(),
    score: t.float(),
    model: t.string(),
    data: t.field({ type: "JSON" }),
  }),
});

const SearchResult = builder.simpleObject("SearchResult", {
  fields: (t) => ({
    total: t.int(),
    hits: t.field({ type: [SearchHit] }),
  }),
});

builder.queryField("search", (t) =>
  t.field({
    type: SearchResult,
    args: {
      query: t.arg.string({ required: true }),
      model: t.arg.string(),
      limit: t.arg.int(),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      // Search is feature-flagged
      const searchEnabled = process.env.FEATURE_SEARCH === "true";
      if (!searchEnabled) {
        return { total: 0, hits: [] };
      }

      // Placeholder — would use SearchService when OpenSearch is running
      // For now, do a simple Prisma text search as fallback
      const models = args.model
        ? [args.model]
        : ["User", "FormDefinition", "WorkflowDefinition"];
      const hits: Array<{
        id: string;
        score: number;
        model: string;
        data: unknown;
      }> = [];

      for (const model of models) {
        if (model === "User") {
          const users = await ctx.prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: args.query, mode: "insensitive" } },
                { email: { contains: args.query, mode: "insensitive" } },
              ],
            },
            take: args.limit ?? 10,
          });
          hits.push(
            ...users.map((u) => ({
              id: u.id,
              score: 1,
              model: "User",
              data: { name: u.name, email: u.email },
            })),
          );
        }
        if (model === "FormDefinition") {
          const forms = await ctx.prisma.formDefinition.findMany({
            where: {
              OR: [
                { name: { contains: args.query, mode: "insensitive" } },
                { description: { contains: args.query, mode: "insensitive" } },
              ],
            },
            take: args.limit ?? 10,
          });
          hits.push(
            ...forms.map((f) => ({
              id: f.id,
              score: 1,
              model: "FormDefinition",
              data: { name: f.name, slug: f.slug },
            })),
          );
        }
        if (model === "WorkflowDefinition") {
          const workflows = await ctx.prisma.workflowDefinition.findMany({
            where: {
              OR: [
                { name: { contains: args.query, mode: "insensitive" } },
                { description: { contains: args.query, mode: "insensitive" } },
              ],
            },
            take: args.limit ?? 10,
          });
          hits.push(
            ...workflows.map((w) => ({
              id: w.id,
              score: 1,
              model: "WorkflowDefinition",
              data: { name: w.name, slug: w.slug },
            })),
          );
        }
      }

      return { total: hits.length, hits };
    },
  }),
);
