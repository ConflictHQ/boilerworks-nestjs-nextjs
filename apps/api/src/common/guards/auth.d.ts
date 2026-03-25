import type { GraphQLContext } from "../../graphql/context";
export declare function requireAuth(ctx: GraphQLContext): asserts ctx is GraphQLContext & {
    user: NonNullable<GraphQLContext["user"]>;
};
export declare function requirePermission(ctx: GraphQLContext, slug: string): void;
//# sourceMappingURL=auth.d.ts.map