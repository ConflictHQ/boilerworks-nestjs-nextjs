import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { QUEUES } from "./queues";

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

  app.use("/admin/queues", serverAdapter.getRouter());
  console.log("Bull Board mounted at /admin/queues");
}
