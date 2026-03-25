import { PrismaService } from "../prisma/prisma.service";
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    hashPassword(password: string): string;
    verifyPassword(password: string, stored: string): boolean;
    createSession(userId: string): Promise<{
        token: string;
    }>;
    validateSession(token: string): Promise<({
        groups: ({
            group: {
                permissions: ({
                    permission: {
                        name: string;
                        id: string;
                        slug: string;
                    };
                } & {
                    groupId: string;
                    permissionId: string;
                })[];
            } & {
                name: string;
                id: string;
            };
        } & {
            userId: string;
            groupId: string;
        })[];
    } & {
        name: string;
        id: string;
        email: string;
        passwordHash: string | null;
        isStaff: boolean;
        isSuperuser: boolean;
        isActive: boolean;
        timezone: string;
        language: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    destroySession(token: string): Promise<void>;
    getEffectivePermissions(user: {
        isSuperuser: boolean;
        groups: Array<{
            group: {
                permissions: Array<{
                    permission: {
                        slug: string;
                    };
                }>;
            };
        }>;
    }): Set<string>;
}
//# sourceMappingURL=auth.service.d.ts.map