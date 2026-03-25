import { builder } from "./builder";
import { createPubSub } from "graphql-yoga";

// PubSub instance for GraphQL subscriptions
// In production, use Redis-backed pub/sub for multi-instance support
export const pubsub = createPubSub<{
  "notification:created": [{ userId: string; subject: string; message: string }];
  "workflow:transitioned": [{ instanceId: string; fromState: string; toState: string }];
  "form:submitted": [{ formId: string; submissionId: string }];
}>();

// Note: Subscriptions require WebSocket transport.
// GraphQL Yoga supports subscriptions natively via SSE (Server-Sent Events).
// For full WebSocket support, add graphql-ws package and configure
// the transport in main.ts.

// Placeholder subscription type — uncomment when subscriptions transport is configured
// builder.subscriptionType({});
//
// builder.subscriptionField("notificationReceived", (t) =>
//   t.field({
//     type: builder.simpleObject("NotificationEvent", {
//       fields: (t) => ({
//         userId: t.string(),
//         subject: t.string(),
//         message: t.string(),
//       }),
//     }),
//     subscribe: (_root, _args, _ctx) => {
//       return pubsub.subscribe("notification:created");
//     },
//     resolve: (payload) => payload,
//   }),
// );

console.log("[Subscriptions] PubSub initialized (SSE transport via Yoga)");
