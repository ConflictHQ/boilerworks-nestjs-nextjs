import { builder } from "../graphql/builder";
import { requireAuth } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
import { randomBytes, createHash } from "crypto";

import "./apikeys.types";

// Return type that includes the raw key (only shown once)
const ApiKeyCreatedResult = builder.simpleObject("ApiKeyCreatedResult", {
  fields: (t) => ({
    ok: t.boolean(),
    key: t.string({ nullable: true }),
    errors: t.field({
      type: [builder.simpleObject("ApiKeyError", {
        fields: (t) => ({
          field: t.string({ nullable: true }),
          message: t.string(),
        }),
      })],
      nullable: true,
    }),
  }),
});

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

builder.queryField("apiKeys", (t) =>
  t.prismaField({
    type: ["ApiKey"],
    resolve: (query, _root, _args, ctx) => {
      requireAuth(ctx);
      return ctx.prisma.apiKey.findMany({
        ...query,
        where: { createdById: ctx.user!.id },
        orderBy: { createdAt: "desc" },
      });
    },
  }),
);

builder.mutationField("createApiKey", (t) =>
  t.field({
    type: ApiKeyCreatedResult,
    args: {
      name: t.arg.string({ required: true }),
      permissions: t.arg({ type: "JSON" }),
      expiresInDays: t.arg.int(),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      const rawKey = `bw_live_${randomBytes(32).toString("hex")}`;
      const keyHash = hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 16);

      const expiresAt = args.expiresInDays
        ? new Date(Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      await ctx.prisma.apiKey.create({
        data: {
          name: args.name,
          keyHash,
          keyPrefix,
          permissions: (args.permissions as any) ?? [],
          createdById: ctx.user!.id,
          expiresAt,
        },
      });

      return { ok: true, key: rawKey, errors: null };
    },
  }),
);

builder.mutationField("revokeApiKey", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      const key = await ctx.prisma.apiKey.findFirst({
        where: { id: args.id, createdById: ctx.user!.id },
      });
      if (!key) return mutationError(null, "API key not found");

      await ctx.prisma.apiKey.delete({ where: { id: args.id } });
      return mutationOk();
    },
  }),
);
