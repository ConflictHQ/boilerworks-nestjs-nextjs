import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { QUEUES } from "./queues";
import type { NotificationJobData } from "./job-dispatcher.service";

@Processor(QUEUES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJobData>) {
    const { userId, subject, message } = job.data;
    console.log(`[Notification] Creating for user ${userId}: ${subject}`);

    await this.prisma.notification.create({
      data: { userId, subject, message },
    });
  }
}
