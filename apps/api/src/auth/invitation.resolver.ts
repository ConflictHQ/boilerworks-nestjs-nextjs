import { builder } from "../graphql/builder";
import { requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
import { randomBytes, createHash, scryptSync } from "crypto";
import { EmailService } from "../notifications/email.service";

const emailService = new EmailService();

builder.mutationField("inviteUser", (t) =>
  t.field({
    type: MutationResult,
    args: {
      email: t.arg.string({ required: true }),
      groupIds: t.arg.stringList({ required: true }),
      organizationId: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "users.create");

      // Check if user already exists
      const existing = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (existing)
        return mutationError("email", "User with this email already exists");

      // Create user with invited status (no password)
      const user = await ctx.prisma.user.create({
        data: {
          email: args.email,
          name: args.email.split("@")[0],
          isActive: false, // Activated on invitation accept
        },
      });

      // Assign to groups
      for (const groupId of args.groupIds) {
        await ctx.prisma.userGroup.create({
          data: { userId: user.id, groupId },
        });
      }

      // Assign to organization if specified
      if (args.organizationId) {
        await ctx.prisma.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: args.organizationId,
            role: "member",
          },
        });
      }

      // Generate invitation token
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token: `invite:${tokenHash}`,
          expiresAt,
        },
      });

      const frontendUrl =
        process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:3000";
      const inviteUrl = `${frontendUrl}/auth/accept-invitation?token=${rawToken}`;

      await emailService.sendInvitation(args.email, inviteUrl, ctx.user!.name);

      return mutationOk();
    },
  }),
);

builder.mutationField("acceptInvitation", (t) =>
  t.field({
    type: MutationResult,
    args: {
      token: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (args.password.length < 8) {
        return mutationError(
          "password",
          "Password must be at least 8 characters",
        );
      }

      const tokenHash = createHash("sha256").update(args.token).digest("hex");

      const session = await ctx.prisma.session.findFirst({
        where: {
          token: `invite:${tokenHash}`,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session)
        return mutationError("token", "Invalid or expired invitation");

      const salt = randomBytes(16).toString("hex");
      const hash = scryptSync(args.password, salt, 64).toString("hex");
      const passwordHash = `${salt}:${hash}`;

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: session.userId },
          data: {
            name: args.name,
            passwordHash,
            isActive: true,
          },
        }),
        ctx.prisma.session.delete({ where: { id: session.id } }),
      ]);

      return mutationOk();
    },
  }),
);
