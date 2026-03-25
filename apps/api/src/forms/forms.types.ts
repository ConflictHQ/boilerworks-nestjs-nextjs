import { builder } from "../graphql/builder";

builder.prismaNode("FormDefinition", {
  id: { field: "id" },
  fields: (t) => ({
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    formType: t.exposeString("formType"),
    status: t.exposeString("status"),
    isPublic: t.exposeBoolean("isPublic"),
    version: t.exposeInt("version"),
    schema: t.expose("schema", { type: "JSON" }),
    fieldConfig: t.expose("fieldConfig", { type: "JSON" }),
    logicRules: t.expose("logicRules", { type: "JSON" }),
    scoring: t.expose("scoring", { type: "JSON", nullable: true }),
    prefill: t.expose("prefill", { type: "JSON", nullable: true }),
    notificationConfig: t.expose("notificationConfig", {
      type: "JSON",
      nullable: true,
    }),
    publishedAt: t.expose("publishedAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    submissions: t.relation("submissions"),
    submissionCount: t.relationCount("submissions"),
  }),
});

builder.prismaNode("FormSubmission", {
  id: { field: "id" },
  fields: (t) => ({
    payload: t.expose("payload", { type: "JSON" }),
    status: t.exposeString("status"),
    submittedAt: t.expose("submittedAt", { type: "DateTime" }),
    form: t.relation("form"),
    submittedBy: t.relation("submittedBy", { nullable: true }),
  }),
});
