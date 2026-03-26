import { Prisma } from "@prisma/client";

// Models that use soft-delete via deletedAt field
const SOFT_DELETE_MODELS = [
  "FormDefinition",
  "WorkflowDefinition",
  "Upload",
  "Organization",
];

/**
 * Prisma extension for soft-delete behavior:
 * - findMany/findFirst automatically filter out deleted records
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: "soft-delete",
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model)) {
          const where = args.where as Record<string, unknown> | undefined;
          if (!where?.deletedAt) {
            args.where = {
              ...args.where,
              deletedAt: null,
            } as unknown as typeof args.where;
          }
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model)) {
          const where = args.where as Record<string, unknown> | undefined;
          if (!where?.deletedAt) {
            args.where = {
              ...args.where,
              deletedAt: null,
            } as unknown as typeof args.where;
          }
        }
        return query(args);
      },
    },
  },
});
