import { builder } from "../graphql/builder";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
import { randomBytes, createHash, scryptSync } from "crypto";

builder.mutationField("requestPasswordReset", (t) =>
  t.field({
    type: MutationResult,
    args: {
      email: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Always return ok to prevent email enumeration
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });

      if (!user) return mutationOk();

      // Generate token
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store hashed token in session table (reusing for simplicity)
      await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token: `reset:${tokenHash}`,
          expiresAt,
        },
      });

      // TODO: Send email via EmailService
      // For now, log the reset URL
      const frontendUrl = process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;
      console.log(`Password reset URL for ${user.email}: ${resetUrl}`);

      return mutationOk();
    },
  }),
);

builder.mutationField("resetPassword", (t) =>
  t.field({
    type: MutationResult,
    args: {
      token: t.arg.string({ required: true }),
      newPassword: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (args.newPassword.length < 8) {
        return mutationError("newPassword", "Password must be at least 8 characters");
      }

      const tokenHash = createHash("sha256").update(args.token).digest("hex");

      const session = await ctx.prisma.session.findFirst({
        where: {
          token: `reset:${tokenHash}`,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        return mutationError("token", "Invalid or expired reset token");
      }

      // Hash new password
      const salt = randomBytes(16).toString("hex");
      const hash = scryptSync(args.newPassword, salt, 64).toString("hex");
      const passwordHash = `${salt}:${hash}`;

      // Update password and delete reset token
      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: session.userId },
          data: { passwordHash },
        }),
        ctx.prisma.session.delete({ where: { id: session.id } }),
      ]);

      return mutationOk();
    },
  }),
);
