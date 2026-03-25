/**
 * Queue names — central registry.
 * Each queue has one processor and handles one type of job.
 */
export const QUEUES = {
  WORKFLOW_ACTIONS: "workflow-actions",
  EMAIL: "email",
  WEBHOOKS: "webhooks",
  NOTIFICATIONS: "notifications",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
