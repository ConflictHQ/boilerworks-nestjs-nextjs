import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "1025", 10),
      secure: false,
    });
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    const from = process.env.SMTP_FROM || "noreply@boilerworks.dev";

    return this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    return this.send({
      to: email,
      subject: "Reset your password — Boilerworks",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  }

  async sendInvitation(email: string, inviteUrl: string, inviterName: string) {
    return this.send({
      to: email,
      subject: `You've been invited to Boilerworks`,
      html: `
        <h2>You've been invited!</h2>
        <p>${inviterName} invited you to join Boilerworks. Click below to set up your account:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>This invitation expires in 7 days.</p>
      `,
      text: `${inviterName} invited you to Boilerworks. Set up your account: ${inviteUrl}`,
    });
  }

  async sendFormNotification(options: {
    to: string;
    formName: string;
    submitterName: string;
    submissionId: string;
  }) {
    return this.send({
      to: options.to,
      subject: `New submission: ${options.formName}`,
      html: `
        <h2>New Form Submission</h2>
        <p><strong>${options.submitterName}</strong> submitted <strong>${options.formName}</strong>.</p>
        <p>Submission ID: ${options.submissionId}</p>
      `,
      text: `New submission on ${options.formName} by ${options.submitterName}. ID: ${options.submissionId}`,
    });
  }
}
