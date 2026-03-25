import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EmailService } from "../notifications/email.service";
import { QUEUES } from "./queues";
import type { EmailJobData } from "./job-dispatcher.service";

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(private readonly email: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>) {
    const { to, subject, html, text } = job.data;
    console.log(`[Email] Sending to ${to}: ${subject}`);
    await this.email.send({ to, subject, html, text });
  }
}
