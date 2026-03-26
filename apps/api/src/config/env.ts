import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional().default("redis://localhost:6379/0"),
  SESSION_SECRET: z
    .string()
    .optional()
    .default("dev-session-secret-change-in-production"),
  S3_ENDPOINT: z.string().optional().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().optional().default("minioadmin"),
  S3_SECRET_KEY: z.string().optional().default("minioadmin"),
  S3_BUCKET: z.string().optional().default("boilerworks"),
  SMTP_HOST: z.string().optional().default("localhost"),
  SMTP_PORT: z.coerce.number().optional().default(1025),
  SMTP_FROM: z.string().optional().default("noreply@boilerworks.dev"),
  CORS_ORIGINS: z.string().optional().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  PORT: z.coerce.number().optional().default(4000),
});

export const env = envSchema.parse(process.env);
