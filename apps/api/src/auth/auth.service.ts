import { Injectable } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    const hashBuffer = Buffer.from(hash, "hex");
    const attempt = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, attempt);
  }

  async createSession(userId: string): Promise<{ token: string }> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.session.create({
      data: { userId, token, expiresAt },
    });

    return { token };
  }

  async validateSession(token: string) {
    if (!token) return null;

    const session = await this.prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            groups: {
              include: {
                group: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) return null;
    return session.user;
  }

  async destroySession(token: string) {
    await this.prisma.session.deleteMany({ where: { token } });
  }

  getEffectivePermissions(user: {
    isSuperuser: boolean;
    groups: Array<{
      group: {
        permissions: Array<{ permission: { slug: string } }>;
      };
    }>;
  }): Set<string> {
    if (user.isSuperuser) return new Set(["*"]);
    const slugs = new Set<string>();
    for (const ug of user.groups) {
      for (const gp of ug.group.permissions) {
        slugs.add(gp.permission.slug);
      }
    }
    return slugs;
  }
}
