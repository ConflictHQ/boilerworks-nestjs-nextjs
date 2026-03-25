import { builder } from "../graphql/builder";
import { requireAuth } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
import { randomBytes, createHash } from "crypto";

builder.mutationField("sendVerificationEmail", (t) =>
  t.field({
    type: MutationResult,
    resolve: async (_root, _args, ctx) => {
      requireAuth(ctx);

      if ((ctx.user as any).emailVerified) {
        return mutationError(null, "Email already verified");
      }

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await ctx.prisma.session.create({
        data: {
          userId: ctx.user!.id,
          token: `verify:${tokenHash}`,
          expiresAt,
        },
      });

      const frontendUrl = process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:3000";
      const verifyUrl = `${frontendUrl}/auth/verify-email?token=${rawToken}`;
      console.log(`Verification URL for ${ctx.user!.email}: ${verifyUrl}`);
      // TODO: Send via EmailService

      return mutationOk();
    },
  }),
);

builder.mutationField("verifyEmail", (t) =>
  t.field({
    type: MutationResult,
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tokenHash = createHash("sha256").update(args.token).digest("hex");

      const session = await ctx.prisma.session.findFirst({
        where: {
          token: `verify:${tokenHash}`,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) return mutationError("token", "Invalid or expired token");

      // Mark user as verified + clean up token
      await ctx.prisma.$transaction([
        // Note: emailVerified field would need to be added to User model
        // For now, this just deletes the token
        ctx.prisma.session.delete({ where: { id: session.id } }),
      ]);

      return mutationOk();
    },
  }),
);
