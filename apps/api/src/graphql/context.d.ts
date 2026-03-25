import { PrismaClient, User } from "@prisma/client";
export type GraphQLContext = {
    user: (User & {
        groups: Array<{
            group: {
                permissions: Array<{
                    permission: {
                        slug: string;
                    };
                }>;
            };
        }>;
    }) | null;
    permissions: Set<string>;
    prisma: PrismaClient;
    req: Request;
};
export declare function createContext(req: Request): Promise<GraphQLContext>;
//# sourceMappingURL=context.d.ts.map