import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Forms Engine", () => {
  let formId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test data
    if (formId) {
      await prisma.formSubmission.deleteMany({ where: { formId } });
      await prisma.formDefinition.delete({ where: { id: formId } });
    }
    await prisma.$disconnect();
  });

  it("can create a form definition", async () => {
    const form = await prisma.formDefinition.create({
      data: {
        name: "Test Form",
        slug: "test-form-spec",
        description: "Created by test",
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
          },
          required: ["name"],
        },
      },
    });

    formId = form.id;
    expect(form.name).toBe("Test Form");
    expect(form.slug).toBe("test-form-spec");
    expect(form.status).toBe("draft");
    expect(form.version).toBe(1);
  });

  it("can publish a form", async () => {
    const form = await prisma.formDefinition.update({
      where: { id: formId },
      data: { status: "published", publishedAt: new Date() },
    });
    expect(form.status).toBe("published");
    expect(form.publishedAt).toBeTruthy();
  });

  it("can submit to a published form", async () => {
    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        payload: { name: "Test User", email: "test@test.com" },
      },
    });
    expect(submission.payload).toEqual({
      name: "Test User",
      email: "test@test.com",
    });
    expect(submission.status).toBe("submitted");
  });

  it("tracks submission count", async () => {
    const count = await prisma.formSubmission.count({ where: { formId } });
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
