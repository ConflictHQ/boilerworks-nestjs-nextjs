import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "./queues";

export type WorkflowActionJobData = {
  action: {
    type: "notify_user" | "send_email" | "call_webhook" | "update_field";
    [key: string]: unknown;
  };
  instanceId: string;
  fromState: string;
  toState: string;
  userId?: string;
};

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type WebhookJobData = {
  url: string;
  secret: string;
  payload: Record<string, unknown>;
};

export type NotificationJobData = {
  userId: string;
  subject: string;
  message: string;
};

@Injectable()
export class JobDispatcher {
  constructor(
    @InjectQueue(QUEUES.WORKFLOW_ACTIONS) private workflowQueue: Queue,
    @InjectQueue(QUEUES.EMAIL) private emailQueue: Queue,
    @InjectQueue(QUEUES.WEBHOOKS) private webhookQueue: Queue,
    @InjectQueue(QUEUES.NOTIFICATIONS) private notificationQueue: Queue,
  ) {}

  async dispatchWorkflowAction(data: WorkflowActionJobData) {
    return this.workflowQueue.add("execute", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  }

  async dispatchEmail(data: EmailJobData) {
    return this.emailQueue.add("send", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
  }

  async dispatchWebhook(data: WebhookJobData) {
    return this.webhookQueue.add("deliver", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  }

  async dispatchNotification(data: NotificationJobData) {
    return this.notificationQueue.add("create", data, {
      attempts: 2,
      backoff: { type: "fixed", delay: 1000 },
    });
  }
}
