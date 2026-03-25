import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../../graphql/context";

export function requireAuth(
  ctx: GraphQLContext,
): asserts ctx is GraphQLContext & {
  user: NonNullable<GraphQLContext["user"]>;
} {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export function requirePermission(ctx: GraphQLContext, slug: string) {
  requireAuth(ctx);
  if (ctx.user.isSuperuser) return;
  if (!ctx.permissions.has(slug)) {
    throw new GraphQLError(`Permission denied: ${slug}`, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}
