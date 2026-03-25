import { GraphQLError } from "graphql";
export function requireAuth(ctx) {
    if (!ctx.user) {
        throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED" },
        });
    }
}
export function requirePermission(ctx, slug) {
    requireAuth(ctx);
    if (ctx.user.isSuperuser)
        return;
    if (!ctx.permissions.has(slug)) {
        throw new GraphQLError(`Permission denied: ${slug}`, {
            extensions: { code: "FORBIDDEN" },
        });
    }
}
//# sourceMappingURL=auth.js.map