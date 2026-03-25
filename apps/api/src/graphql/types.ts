import { builder } from "./builder";

// MutationError type
export const MutationError = builder.simpleObject("MutationError", {
  fields: (t) => ({
    field: t.string({ nullable: true }),
    message: t.string(),
  }),
});

// MutationResult type — every mutation returns this
export const MutationResult = builder.simpleObject("MutationResult", {
  fields: (t) => ({
    ok: t.boolean(),
    errors: t.field({
      type: [MutationError],
      nullable: true,
    }),
  }),
});

// Helper to build a success result
export function mutationOk() {
  return { ok: true, errors: null };
}

// Helper to build an error result
export function mutationError(field: string | null, message: string) {
  return { ok: false, errors: [{ field, message }] };
}

// Helper to map Zod errors to MutationResult
export function zodToMutationErrors(zodError: { issues: Array<{ path: (string | number)[]; message: string }> }) {
  return {
    ok: false,
    errors: zodError.issues.map((issue) => ({
      field: issue.path.join(".") || null,
      message: issue.message,
    })),
  };
}
