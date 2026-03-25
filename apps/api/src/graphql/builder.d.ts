import type PrismaTypes from "@pothos/plugin-prisma/generated";
import type { GraphQLContext } from "./context";
export declare const builder: PothosSchemaTypes.SchemaBuilder<PothosSchemaTypes.ExtendDefaultTypes<{
    PrismaTypes: PrismaTypes;
    Context: GraphQLContext;
    Scalars: {
        DateTime: {
            Input: Date;
            Output: Date;
        };
        JSON: {
            Input: unknown;
            Output: unknown;
        };
    };
}>>;
//# sourceMappingURL=builder.d.ts.map