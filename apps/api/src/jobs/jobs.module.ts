import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "./queues";
import { WorkflowActionProcessor } from "./workflow-action.processor";
import { EmailProcessor } from "./email.processor";
import { WebhookProcessor } from "./webhook.processor";
import { NotificationProcessor } from "./notification.processor";
import { JobDispatcher } from "./job-dispatcher.service";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
      },
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
  ],
  exports: [JobDispatcher],
})
export class JobsModule {}
