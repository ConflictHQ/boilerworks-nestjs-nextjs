import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Notifications", () => {
  let userId: string;
  let notificationId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const user = await prisma.user.findUnique({
      where: { email: "admin@boilerworks.dev" },
    });
    userId = user!.id;
  });

  afterAll(async () => {
    if (notificationId) {
      await prisma.notification.delete({ where: { id: notificationId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("can create a notification", async () => {
    const notification = await prisma.notification.create({
      data: {
        userId,
        subject: "Test notification",
        message: "This is a test notification from specs.",
      },
    });

    notificationId = notification.id;
    expect(notification.subject).toBe("Test notification");
    expect(notification.isRead).toBe(false);
  });

  it("can mark notification as read", async () => {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    expect(notification.isRead).toBe(true);
  });

  it("can count unread notifications", async () => {
    // Reset to unread for counting
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: false },
    });

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("can batch mark all as read", async () => {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    const unread = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    expect(unread).toBe(0);
  });
});
