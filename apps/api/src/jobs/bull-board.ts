import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { QUEUES } from "./queues";
import { AuthService } from "../auth/auth.service";
import { PrismaClient } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();
const authService = new AuthService(prisma as any);

/**
 * Middleware that requires a valid session cookie to access Bull Board.
 * Only superusers are allowed.
 */
async function requireBullBoardAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.backend_jwt;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await authService.validateSession(token);
  if (!user || !user.isSuperuser) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}

/**
 * Set up Bull Board monitoring UI at /admin/queues.
 * Call this after NestJS app is created.
 */
export function setupBullBoard(app: any) {
  const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  };

  const queues = Object.values(QUEUES).map(
    (name) => new BullMQAdapter(new Queue(name, { connection })),
  );

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues,
    serverAdapter,
  });

  app.use("/admin/queues", requireBullBoardAuth, serverAdapter.getRouter());
  console.log("Bull Board mounted at /admin/queues");
}
