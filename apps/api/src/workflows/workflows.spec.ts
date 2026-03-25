import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Workflow Engine", () => {
  let workflowId: string;
  let instanceId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (instanceId) {
      await prisma.transitionLog.deleteMany({ where: { instanceId } });
      await prisma.workflowInstance.delete({ where: { id: instanceId } });
    }
    if (workflowId) {
      await prisma.workflowDefinition.delete({ where: { id: workflowId } });
    }
    await prisma.$disconnect();
  });

  it("can create a workflow definition", async () => {
    const workflow = await prisma.workflowDefinition.create({
      data: {
        name: "Test Workflow",
        slug: "test-workflow-spec",
        modelName: "TestModel",
        states: [
          {
            name: "draft",
            label: "Draft",
            isInitial: true,
            isFinal: false,
            color: "#3b82f6",
          },
          {
            name: "active",
            label: "Active",
            isInitial: false,
            isFinal: false,
            color: "#22c55e",
          },
          {
            name: "done",
            label: "Done",
            isInitial: false,
            isFinal: true,
            color: "#6b7280",
          },
        ],
        transitions: [
          { fromState: "draft", toState: "active", label: "Activate" },
          { fromState: "active", toState: "done", label: "Complete" },
        ],
      },
    });

    workflowId = workflow.id;
    expect(workflow.name).toBe("Test Workflow");
    expect(workflow.isEnabled).toBe(true);
  });

  it("can start a workflow instance", async () => {
    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId,
        targetModel: "TestModel",
        targetId: "test-1",
        currentState: "draft",
      },
    });

    instanceId = instance.id;
    expect(instance.currentState).toBe("draft");
    expect(instance.completedAt).toBeNull();
  });

  it("can transition state", async () => {
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { currentState: "active" },
    });

    await prisma.transitionLog.create({
      data: {
        instanceId,
        fromState: "draft",
        toState: "active",
        note: "Test transition",
      },
    });

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });
    expect(instance!.currentState).toBe("active");
  });

  it("records transition logs", async () => {
    const logs = await prisma.transitionLog.findMany({
      where: { instanceId },
      orderBy: { timestamp: "asc" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].fromState).toBe("draft");
    expect(logs[0].toState).toBe("active");
  });

  it("can complete workflow at final state", async () => {
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { currentState: "done", completedAt: new Date() },
    });

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });
    expect(instance!.currentState).toBe("done");
    expect(instance!.completedAt).toBeTruthy();
  });
});
