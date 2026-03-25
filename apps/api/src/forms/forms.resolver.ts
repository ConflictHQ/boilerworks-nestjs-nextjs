import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";

import { MutationResult, mutationOk, mutationError } from "../graphql/types";

// Import types (side-effect)
import "./forms.types";

// --- Queries ---

builder.queryField("formDefinitions", (t) =>
  t.prismaField({
    type: ["FormDefinition"],
    args: {
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "forms.view");
      return ctx.prisma.formDefinition.findMany({
        ...query,
        where: args.status ? { status: args.status } : {},
        orderBy: { createdAt: "desc" },
      });
    },
  }),
);

builder.queryField("formDefinition", (t) =>
  t.prismaField({
    type: "FormDefinition",
    nullable: true,
    args: {
      slug: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "forms.view");
      return ctx.prisma.formDefinition.findFirst({
        ...query,
        where: { slug: args.slug },
        orderBy: { version: "desc" },
      });
    },
  }),
);

builder.queryField("formSubmissions", (t) =>
  t.prismaField({
    type: ["FormSubmission"],
    args: {
      formId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "forms.view");
      return ctx.prisma.formSubmission.findMany({
        ...query,
        where: { formId: args.formId },
        orderBy: { submittedAt: "desc" },
      });
    },
  }),
);

// --- Mutations ---

builder.mutationField("createFormDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      name: t.arg.string({ required: true }),
      slug: t.arg.string({ required: true }),
      description: t.arg.string(),
      formType: t.arg.string(),
      isPublic: t.arg.boolean(),
      schema: t.arg({ type: "JSON" }),
      fieldConfig: t.arg({ type: "JSON" }),
      logicRules: t.arg({ type: "JSON" }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "forms.create");

      // Check for existing slug at version 1
      const existing = await ctx.prisma.formDefinition.findUnique({
        where: { slug_version: { slug: args.slug, version: 1 } },
      });
      if (existing)
        return mutationError("slug", "A form with this slug already exists");

      await ctx.prisma.formDefinition.create({
        data: {
          name: args.name,
          slug: args.slug,
          description: args.description,
          formType: args.formType ?? "standard",
          isPublic: args.isPublic ?? false,
          schema: (args.schema as any) ?? {},
          fieldConfig: (args.fieldConfig as any) ?? {},
          logicRules: (args.logicRules as any) ?? [],
          createdById: ctx.user!.id,
        },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("updateFormDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      description: t.arg.string(),
      schema: t.arg({ type: "JSON" }),
      fieldConfig: t.arg({ type: "JSON" }),
      logicRules: t.arg({ type: "JSON" }),
      isPublic: t.arg.boolean(),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "forms.edit");

      const form = await ctx.prisma.formDefinition.findUnique({
        where: { id: args.id },
      });
      if (!form) return mutationError(null, "Form not found");
      if (form.status === "published") {
        return mutationError(
          null,
          "Cannot edit a published form. Create a new version instead.",
        );
      }

      const data: Record<string, unknown> = {};
      if (args.name != null) data.name = args.name;
      if (args.description !== undefined) data.description = args.description;
      if (args.schema != null) data.schema = args.schema;
      if (args.fieldConfig != null) data.fieldConfig = args.fieldConfig;
      if (args.logicRules != null) data.logicRules = args.logicRules;
      if (args.isPublic != null) data.isPublic = args.isPublic;

      await ctx.prisma.formDefinition.update({ where: { id: args.id }, data });
      return mutationOk();
    },
  }),
);

builder.mutationField("publishFormDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "forms.edit");

      const form = await ctx.prisma.formDefinition.findUnique({
        where: { id: args.id },
      });
      if (!form) return mutationError(null, "Form not found");
      if (form.status === "published")
        return mutationError(null, "Already published");

      // Archive any currently published version of this slug
      await ctx.prisma.formDefinition.updateMany({
        where: { slug: form.slug, status: "published" },
        data: { status: "archived" },
      });

      await ctx.prisma.formDefinition.update({
        where: { id: args.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          publishedById: ctx.user!.id,
        },
      });

      return mutationOk();
    },
  }),
);

builder.mutationField("archiveFormDefinition", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "forms.edit");

      await ctx.prisma.formDefinition.update({
        where: { id: args.id },
        data: { status: "archived" },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("submitForm", (t) =>
  t.field({
    type: MutationResult,
    args: {
      formId: t.arg.string({ required: true }),
      payload: t.arg({ type: "JSON", required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "forms.submit");

      const form = await ctx.prisma.formDefinition.findUnique({
        where: { id: args.formId },
      });
      if (!form) return mutationError(null, "Form not found");
      if (form.status !== "published") {
        return mutationError(null, "Form is not published");
      }

      await ctx.prisma.formSubmission.create({
        data: {
          formId: args.formId,
          payload: args.payload as any,
          submittedById: ctx.user!.id,
        },
      });
      return mutationOk();
    },
  }),
);

// --- Public form submission (no auth required) ---

builder.queryField("publicForm", (t) =>
  t.prismaField({
    type: "FormDefinition",
    nullable: true,
    args: {
      slug: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) => {
      // No auth required — only returns published public forms
      return ctx.prisma.formDefinition.findFirst({
        ...query,
        where: { slug: args.slug, status: "published", isPublic: true },
        orderBy: { version: "desc" },
      });
    },
  }),
);

builder.mutationField("submitPublicForm", (t) =>
  t.field({
    type: MutationResult,
    args: {
      slug: t.arg.string({ required: true }),
      payload: t.arg({ type: "JSON", required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // No auth required — public form submission
      const form = await ctx.prisma.formDefinition.findFirst({
        where: { slug: args.slug, status: "published", isPublic: true },
        orderBy: { version: "desc" },
      });
      if (!form) return mutationError(null, "Form not found or not public");

      await ctx.prisma.formSubmission.create({
        data: {
          formId: form.id,
          payload: args.payload as any,
          submittedById: ctx.user?.id,
        },
      });
      return mutationOk();
    },
  }),
);
