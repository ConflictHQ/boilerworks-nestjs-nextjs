import { PrismaService } from "./prisma/prisma.service";
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        checks: Record<string, boolean>;
        timestamp: string;
    }>;
}
//# sourceMappingURL=health.controller.d.ts.map