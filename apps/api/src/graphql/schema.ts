import { builder } from "./builder";
import { features } from "../config/features";

// Register shared types
import "./types";

// --- Always-on modules ---
import "../users/users.resolver";
import "../permissions/permissions.resolver";
import "../permissions/permissions.debug";
import "../uploads/uploads.resolver";
import "../notifications/notifications.resolver";
import "../common/audit.resolver";
import "../organizations/organizations.resolver";
import "../auth/apikeys.resolver";
import "../auth/password-reset.resolver";
import "../auth/email-verification.resolver";
import "../auth/invitation.resolver";
import "./subscriptions";

// --- Feature-gated modules ---
if (features.forms) {
  require("../forms/forms.resolver");
  require("../forms/forms.analytics");
}

if (features.workflows) {
  require("../workflows/workflows.resolver");
  require("../rules/rules.types");
}

if (features.search) {
  require("../search/search.resolver");
}

// --- Feature flags query (always available) ---

const FeatureFlags = builder.simpleObject("FeatureFlags", {
  fields: (t) => ({
    forms: t.boolean(),
    workflows: t.boolean(),
    search: t.boolean(),
    temporal: t.boolean(),
  }),
});

builder.queryField("features", (t) =>
  t.field({
    type: FeatureFlags,
    resolve: () => features,
  }),
);

builder.queryField("healthCheck", (t) =>
  t.string({
    resolve: () => "GraphQL is running",
  }),
);

builder.mutationField("_ping", (t) =>
  t.boolean({
    resolve: () => true,
  }),
);

export const schema = builder.toSchema();
