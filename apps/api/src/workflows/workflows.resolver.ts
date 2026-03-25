import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";

// Import types (side-effect)
import "./workflows.types";

// --- Queries ---

builder.queryField("workflowDefinitions", (t) =>
  t.prismaField({
    type: ["WorkflowDefinition"],
    args: {
      modelName: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "workflows.view");
      return ctx.prisma.workflowDefinition.findMany({
        ...query,
        where: args.modelName ? { modelName: args.modelName } : {},
        orderBy: { createdAt: "desc" },
      });
    },
  }),
);

builder.queryField("workflowDefinition", (t) =>
  t.prismaField({
    type: "WorkflowDefinition",
    nullable: true,
    args: {
      slug: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "workflows.view");
      return ctx.prisma.workflowDefinition.findFirst({
        ...query,
        where: { slug: args.slug },
      });
    },
  }),
);

builder.queryField("workflowInstance", (t) =>
  t.prismaField({
    type: "WorkflowInstance",
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "workflows.view");
      return ctx.prisma.workflowInstance.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  }),
);

builder.queryField("transitionLogs", (t) =>
  t.prismaField({
    type: ["TransitionLog"],
    args: {
      instanceId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "workflows.view");
      return ctx.prisma.transitionLog.findMany({
        ...query,
        where: { instanceId: args.instanceId },
        orderBy: { timestamp: "asc" },
      });
    },
  }),
);

// --- Mutations ---

builder.mutationField("createWorkflowDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      name: t.arg.string({ required: true }),
      slug: t.arg.string({ required: true }),
      modelName: t.arg.string({ required: true }),
      description: t.arg.string(),
      states: t.arg({ type: "JSON", required: true }),
      transitions: t.arg({ type: "JSON", required: true }),
      isEnabled: t.arg.boolean(),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "workflows.create");

      const existing = await ctx.prisma.workflowDefinition.findFirst({
        where: { slug: args.slug, modelName: args.modelName },
      });
      if (existing) return mutationError("slug", "Workflow with this slug already exists for this model");

      await ctx.prisma.workflowDefinition.create({
        data: {
          name: args.name,
          slug: args.slug,
          modelName: args.modelName,
          description: args.description,
          states: args.states as any,
          transitions: args.transitions as any,
          isEnabled: args.isEnabled ?? true,
        },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("updateWorkflowDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      slug: t.arg.string({ required: true }),
      name: t.arg.string(),
      description: t.arg.string(),
      modelName: t.arg.string(),
      states: t.arg({ type: "JSON" }),
      transitions: t.arg({ type: "JSON" }),
      isEnabled: t.arg.boolean(),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "workflows.edit");

      const workflow = await ctx.prisma.workflowDefinition.findFirst({
        where: { slug: args.slug },
      });
      if (!workflow) return mutationError(null, "Workflow not found");

      const data: Record<string, unknown> = {};
      if (args.name != null) data.name = args.name;
      if (args.description !== undefined) data.description = args.description;
      if (args.modelName != null) data.modelName = args.modelName;
      if (args.states != null) data.states = args.states;
      if (args.transitions != null) data.transitions = args.transitions;
      if (args.isEnabled != null) data.isEnabled = args.isEnabled;

      await ctx.prisma.workflowDefinition.update({
        where: { id: workflow.id },
        data,
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("deleteWorkflowDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      slug: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "workflows.delete");

      const workflow = await ctx.prisma.workflowDefinition.findFirst({
        where: { slug: args.slug },
      });
      if (!workflow) return mutationError(null, "Workflow not found");

      await ctx.prisma.workflowDefinition.delete({
        where: { id: workflow.id },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("startWorkflow", (t) =>
  t.field({
    type: MutationResult,
    args: {
      workflowSlug: t.arg.string({ required: true }),
      targetModel: t.arg.string({ required: true }),
      targetId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "workflows.transition");

      const workflow = await ctx.prisma.workflowDefinition.findFirst({
        where: { slug: args.workflowSlug, isEnabled: true },
      });
      if (!workflow) return mutationError(null, "Workflow not found or disabled");

      const states = workflow.states as Array<{ name: string; isInitial?: boolean }>;
      const initialState = states.find((s) => s.isInitial);
      if (!initialState) return mutationError(null, "No initial state defined");

      const instance = await ctx.prisma.workflowInstance.create({
        data: {
          workflowId: workflow.id,
          targetModel: args.targetModel,
          targetId: args.targetId,
          currentState: initialState.name,
        },
      });

      // Log the initial transition
      await ctx.prisma.transitionLog.create({
        data: {
          instanceId: instance.id,
          fromState: "",
          toState: initialState.name,
          transitionedById: ctx.user!.id,
          note: "Workflow started",
        },
      });

      return mutationOk();
    },
  }),
);

builder.mutationField("transitionWorkflow", (t) =>
  t.field({
    type: MutationResult,
    args: {
      instanceId: t.arg.string({ required: true }),
      toState: t.arg.string({ required: true }),
      note: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "workflows.transition");

      const instance = await ctx.prisma.workflowInstance.findUnique({
        where: { id: args.instanceId },
        include: { workflow: true },
      });
      if (!instance) return mutationError(null, "Instance not found");
      if (instance.completedAt) return mutationError(null, "Workflow already completed");

      const transitions = instance.workflow.transitions as Array<{
        fromState: string;
        toState: string;
        conditions?: unknown[];
      }>;

      const validTransition = transitions.find(
        (t) => t.fromState === instance.currentState && t.toState === args.toState,
      );
      if (!validTransition) {
        return mutationError(
          "toState",
          `Invalid transition from "${instance.currentState}" to "${args.toState}"`,
        );
      }

      // Check if target state is final
      const states = instance.workflow.states as Array<{
        name: string;
        isFinal?: boolean;
      }>;
      const targetState = states.find((s) => s.name === args.toState);
      const isFinal = targetState?.isFinal ?? false;

      // Execute transition in a transaction
      await ctx.prisma.$transaction([
        ctx.prisma.workflowInstance.update({
          where: { id: args.instanceId },
          data: {
            currentState: args.toState,
            ...(isFinal ? { completedAt: new Date() } : {}),
          },
        }),
        ctx.prisma.transitionLog.create({
          data: {
            instanceId: args.instanceId,
            fromState: instance.currentState,
            toState: args.toState,
            transitionedById: ctx.user!.id,
            note: args.note ?? "",
          },
        }),
      ]);

      return mutationOk();
    },
  }),
);
