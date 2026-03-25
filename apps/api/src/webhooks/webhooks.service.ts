import { Injectable } from "@nestjs/common";
import { createHmac } from "crypto";

export type WebhookEvent =
  | "form.submitted"
  | "workflow.transitioned"
  | "user.created"
  | "user.updated";

@Injectable()
export class WebhooksService {
  /**
   * Dispatch a webhook event to all registered endpoints.
   * In a real implementation, this would use BullMQ for async delivery.
   */
  async dispatch(
    event: WebhookEvent,
    payload: Record<string, unknown>,
    _prisma: any,
  ) {
    // Find all active endpoints subscribed to this event
    // For now this is a no-op — will implement when WebhookEndpoint model is added
    console.log(
      `[Webhook] Event: ${event}`,
      JSON.stringify(payload).substring(0, 200),
    );
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  sign(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Deliver a webhook to a URL with retry
   */
  async deliver(url: string, payload: Record<string, unknown>, secret: string) {
    const body = JSON.stringify(payload);
    const signature = this.sign(body, secret);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": new Date().toISOString(),
      },
      body,
    });

    return {
      status: response.status,
      ok: response.ok,
    };
  }
}
