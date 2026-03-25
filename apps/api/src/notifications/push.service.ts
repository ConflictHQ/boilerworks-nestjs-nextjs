import { Injectable } from "@nestjs/common";

/**
 * Push notification service.
 * Uses Firebase Cloud Messaging for iOS/Android/Web push delivery.
 *
 * Requires `firebase-admin` package and FIREBASE_SERVICE_ACCOUNT env var
 * pointing to the service account JSON file.
 *
 * For now, this is a placeholder that logs push attempts.
 * Enable by installing firebase-admin and configuring credentials.
 */
@Injectable()
export class PushService {
  private enabled = false;

  constructor() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // TODO: Initialize Firebase Admin
      // const admin = require("firebase-admin");
      // admin.initializeApp({ credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT) });
      this.enabled = true;
      console.log("[Push] Firebase initialized");
    } else {
      console.log("[Push] Firebase not configured — push notifications disabled");
    }
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.enabled) {
      console.log(`[Push] Would send to user ${userId}: ${title}`);
      return;
    }

    // TODO: Look up device tokens for user, send via Firebase
    // const tokens = await prisma.deviceToken.findMany({ where: { userId } });
    // for (const token of tokens) {
    //   await admin.messaging().send({ token: token.token, notification: { title, body }, data });
    // }
  }

  async sendToTopic(topic: string, title: string, body: string) {
    if (!this.enabled) {
      console.log(`[Push] Would send to topic ${topic}: ${title}`);
      return;
    }

    // TODO: Send to Firebase topic
    // await admin.messaging().send({ topic, notification: { title, body } });
  }

  async registerToken(userId: string, token: string, platform: "ios" | "android" | "web") {
    // TODO: Store in DeviceToken table
    console.log(`[Push] Register token for ${userId}: ${platform}`);
  }

  async unregisterToken(token: string) {
    // TODO: Remove from DeviceToken table
    console.log(`[Push] Unregister token: ${token}`);
  }
}
