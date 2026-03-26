import { builder } from "../graphql/builder";
import { requireAuth, requirePermission } from "../common/guards/auth";
import { MutationResult, mutationOk, mutationError } from "../graphql/types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

import "./uploads.types";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitizeFilename(filename: string): string {
  // Strip path traversal sequences and null bytes, keep only the basename
  return filename
    .replace(/\0/g, "")
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "_")
    .trim();
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

const bucket = process.env.S3_BUCKET || "boilerworks";

// Return type for presigned upload
const PresignedUploadResult = builder.simpleObject("PresignedUploadResult", {
  fields: (t) => ({
    uploadId: t.string(),
    presignedUrl: t.string(),
    s3Key: t.string(),
  }),
});

builder.queryField("uploads", (t) =>
  t.prismaField({
    type: ["Upload"],
    resolve: (query, _root, _args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "uploads.view");
      return ctx.prisma.upload.findMany({
        ...query,
        orderBy: { createdAt: "desc" },
      });
    },
  }),
);

builder.mutationField("requestUpload", (t) =>
  t.field({
    type: PresignedUploadResult,
    args: {
      filename: t.arg.string({ required: true }),
      contentType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);
      requirePermission(ctx, "uploads.create");

      if (!ALLOWED_CONTENT_TYPES.has(args.contentType)) {
        throw new Error(
          `Content type "${args.contentType}" is not allowed. Allowed types: ${[...ALLOWED_CONTENT_TYPES].join(", ")}`,
        );
      }

      const safeFilename = sanitizeFilename(args.filename);
      if (!safeFilename) {
        throw new Error("Invalid filename");
      }

      const key = `uploads/${Date.now()}-${randomBytes(8).toString("hex")}-${safeFilename}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: args.contentType,
        ContentLength: MAX_FILE_SIZE,
      });

      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

      const upload = await ctx.prisma.upload.create({
        data: {
          filename: safeFilename,
          contentType: args.contentType,
          size: 0,
          s3Key: key,
          uploadedById: ctx.user!.id,
        },
      });

      return {
        uploadId: upload.id,
        presignedUrl,
        s3Key: key,
      };
    },
  }),
);

builder.mutationField("confirmUpload", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
      size: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireAuth(ctx);

      // Verify the upload belongs to the current user
      const upload = await ctx.prisma.upload.findUnique({
        where: { id: args.id },
      });
      if (
        !upload ||
        (upload.uploadedById &&
          upload.uploadedById !== ctx.user!.id &&
          !ctx.user!.isSuperuser)
      ) {
        return mutationError(null, "Upload not found or access denied");
      }

      await ctx.prisma.upload.update({
        where: { id: args.id },
        data: { size: args.size },
      });
      return mutationOk();
    },
  }),
);

builder.mutationField("deleteUpload", (t) =>
  t.field({
    type: MutationResult,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requirePermission(ctx, "uploads.delete");

      const upload = await ctx.prisma.upload.findUnique({
        where: { id: args.id },
      });
      if (
        !upload ||
        (upload.uploadedById &&
          upload.uploadedById !== ctx.user!.id &&
          !ctx.user!.isSuperuser)
      ) {
        return mutationError(null, "Upload not found or access denied");
      }

      await ctx.prisma.upload.delete({ where: { id: args.id } });
      return mutationOk();
    },
  }),
);
