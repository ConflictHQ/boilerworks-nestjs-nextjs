import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { features } from "./config/features";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const checks: Record<string, boolean> = { api: true };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = true;
    } catch {
      checks.db = false;
    }

    const healthy = Object.values(checks).every(Boolean);

    return {
      status: healthy ? "ok" : "degraded",
      checks,
      features,
      timestamp: new Date().toISOString(),
    };
  }
}
