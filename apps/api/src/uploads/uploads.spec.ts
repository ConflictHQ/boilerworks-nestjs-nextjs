import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Uploads", () => {
  let uploadId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (uploadId) {
      await prisma.upload.delete({ where: { id: uploadId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("can create an upload record", async () => {
    const upload = await prisma.upload.create({
      data: {
        filename: "test.pdf",
        contentType: "application/pdf",
        size: 0,
        s3Key: "uploads/test-spec-" + Date.now() + ".pdf",
      },
    });

    uploadId = upload.id;
    expect(upload.filename).toBe("test.pdf");
    expect(upload.size).toBe(0);
  });

  it("can confirm upload with size", async () => {
    const upload = await prisma.upload.update({
      where: { id: uploadId },
      data: { size: 12345 },
    });
    expect(upload.size).toBe(12345);
  });

  it("can delete an upload", async () => {
    await prisma.upload.delete({ where: { id: uploadId } });
    const found = await prisma.upload.findUnique({ where: { id: uploadId } });
    expect(found).toBeNull();
    uploadId = ""; // prevent afterAll cleanup
  });
});
