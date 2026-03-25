import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("AuthService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should have seeded admin user", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@boilerworks.dev" },
    });
    expect(admin).toBeTruthy();
    expect(admin!.isSuperuser).toBe(true);
    expect(admin!.name).toBe("Admin User");
  });

  it("should have seeded groups", async () => {
    const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
    expect(groups.length).toBeGreaterThanOrEqual(3);
    const names = groups.map((g) => g.name);
    expect(names).toContain("Admin");
    expect(names).toContain("Editor");
    expect(names).toContain("Viewer");
  });

  it("should have seeded permissions", async () => {
    const permissions = await prisma.permission.findMany();
    expect(permissions.length).toBeGreaterThanOrEqual(20);
    const slugs = permissions.map((p) => p.slug);
    expect(slugs).toContain("users.view");
    expect(slugs).toContain("forms.create");
    expect(slugs).toContain("workflows.transition");
  });

  it("admin should be in Admin group", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@boilerworks.dev" },
      include: { groups: { include: { group: true } } },
    });
    const groupNames = admin!.groups.map((ug) => ug.group.name);
    expect(groupNames).toContain("Admin");
  });

  it("can create and validate a session", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@boilerworks.dev" },
    });

    // Create session
    const token = "test-session-token-" + Date.now();
    const session = await prisma.session.create({
      data: {
        userId: admin!.id,
        token,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    expect(session.token).toBe(token);

    // Validate session
    const found = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    expect(found).toBeTruthy();
    expect(found!.user.email).toBe("admin@boilerworks.dev");

    // Cleanup
    await prisma.session.delete({ where: { id: session.id } });
  });
});
