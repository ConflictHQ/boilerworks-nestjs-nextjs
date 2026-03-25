import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "./queues";
import { WorkflowActionProcessor } from "./workflow-action.processor";
import { EmailProcessor } from "./email.processor";
import { WebhookProcessor } from "./webhook.processor";
import { NotificationProcessor } from "./notification.processor";
import { JobDispatcher } from "./job-dispatcher.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailService } from "../notifications/email.service";

@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot({
      connection: (() => {
        const url = process.env.REDIS_URL || "redis://localhost:6379/0";
        const parsed = new URL(url);
        return {
          host: parsed.hostname,
          port: parseInt(parsed.port || "6379", 10),
        };
      })(),
    }),
    BullModule.registerQueue(
      { name: QUEUES.WORKFLOW_ACTIONS },
      { name: QUEUES.EMAIL },
      { name: QUEUES.WEBHOOKS },
      { name: QUEUES.NOTIFICATIONS },
    ),
  ],
  providers: [
    WorkflowActionProcessor,
    EmailProcessor,
    WebhookProcessor,
    NotificationProcessor,
    JobDispatcher,
    EmailService,
  ],
  exports: [JobDispatcher],
})
export class JobsModule {}
