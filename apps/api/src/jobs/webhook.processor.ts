import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { createHmac } from "crypto";
import { QUEUES } from "./queues";
import type { WebhookJobData } from "./job-dispatcher.service";

@Processor(QUEUES.WEBHOOKS)
export class WebhookProcessor extends WorkerHost {
  async process(job: Job<WebhookJobData>) {
    const { url, secret, payload } = job.data;
    const body = JSON.stringify(payload);
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    console.log(`[Webhook] Delivering to ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": new Date().toISOString(),
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Webhook delivery failed: ${response.status} ${response.statusText}`,
      );
    }

    console.log(`[Webhook] Delivered to ${url}: ${response.status}`);
  }
}
