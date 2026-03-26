import { PrismaClient } from "@prisma/client";

/**
 * Send notifications for form events.
 * Called after form submissions and status changes.
 */
export async function notifyFormEvent(
  prisma: PrismaClient,
  event: "submitted" | "approved" | "rejected" | "published",
  formId: string,
  submissionId?: string,
  userId?: string,
) {
  const form = await prisma.formDefinition.findUnique({
    where: { id: formId },
  });
  if (!form) return;

  const notificationConfig = form.notificationConfig as {
    on_submit?: { notify: string[] };
    on_approve?: { notify: string[] };
    on_reject?: { notify: string[] };
  } | null;

  if (!notificationConfig) return;

  let recipients: string[] = [];

  switch (event) {
    case "submitted":
      recipients = notificationConfig.on_submit?.notify ?? [];
      break;
    case "approved":
      recipients = notificationConfig.on_approve?.notify ?? [];
      break;
    case "rejected":
      recipients = notificationConfig.on_reject?.notify ?? [];
      break;
  }

  for (const recipient of recipients) {
    if (recipient === "submitter" && userId) {
      await prisma.notification.create({
        data: {
          userId,
          subject: `Form ${event}: ${form.name}`,
          message: `Your submission to "${form.name}" has been ${event}.`,
        },
      });
    }
    // "role:<rolename>" recipients would query groups
    // For now, just handle direct user notifications
  }
}
