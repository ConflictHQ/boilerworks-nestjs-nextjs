import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
import { QUEUES } from "./queues";
import type { WorkflowActionJobData } from "./job-dispatcher.service";

@Processor(QUEUES.WORKFLOW_ACTIONS)
export class WorkflowActionProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {
    super();
  }

  async process(job: Job<WorkflowActionJobData>) {
    const { action, instanceId, fromState, toState, userId } = job.data;
    console.log(`[WorkflowAction] Processing ${action.type} for instance ${instanceId}`);

    switch (action.type) {
      case "notify_user": {
        const targetUserId = (action.user as string) || userId;
        if (targetUserId) {
          await this.prisma.notification.create({
            data: {
              userId: targetUserId,
              subject: (action.subject as string) || `Workflow transitioned: ${fromState} → ${toState}`,
              message: (action.message as string) || `Instance ${instanceId} moved from ${fromState} to ${toState}.`,
            },
          });
        }
        break;
      }

      case "send_email": {
        await this.email.send({
          to: action.to as string,
          subject: (action.subject as string) || `Workflow transition: ${fromState} → ${toState}`,
          html: (action.message as string) || `<p>Instance ${instanceId} transitioned from ${fromState} to ${toState}.</p>`,
        });
        break;
      }

      case "call_webhook": {
        const response = await fetch(action.url as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instanceId, fromState, toState, userId, action }),
        });
        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }
        break;
      }

      case "update_field": {
        // Polymorphic field update — resolve targetModel + targetId from instance
        const instance = await this.prisma.workflowInstance.findUnique({
          where: { id: instanceId },
        });
        if (instance) {
          console.log(`[WorkflowAction] Would update ${instance.targetModel}:${instance.targetId} field ${action.field} = ${action.value}`);
          // Actual update depends on targetModel — implement per-model
        }
        break;
      }

      default:
        console.warn(`[WorkflowAction] Unknown action type: ${action.type}`);
    }
  }
}
