import { builder } from "../graphql/builder";

builder.prismaNode("WorkflowDefinition", {
  id: { field: "id" },
  fields: (t) => ({
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    modelName: t.exposeString("modelName"),
    states: t.expose("states", { type: "JSON" }),
    transitions: t.expose("transitions", { type: "JSON" }),
    isEnabled: t.exposeBoolean("isEnabled"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    instances: t.relation("instances"),
    instanceCount: t.relationCount("instances"),
  }),
});

builder.prismaNode("WorkflowInstance", {
  id: { field: "id" },
  fields: (t) => ({
    targetModel: t.exposeString("targetModel"),
    targetId: t.exposeString("targetId"),
    currentState: t.exposeString("currentState"),
    startedAt: t.expose("startedAt", { type: "DateTime" }),
    completedAt: t.expose("completedAt", { type: "DateTime", nullable: true }),
    workflow: t.relation("workflow"),
    transitionLogs: t.relation("transitionLogs"),
  }),
});

builder.prismaNode("TransitionLog", {
  id: { field: "id" },
  fields: (t) => ({
    fromState: t.exposeString("fromState"),
    toState: t.exposeString("toState"),
    note: t.exposeString("note"),
    timestamp: t.expose("timestamp", { type: "DateTime" }),
    instance: t.relation("instance"),
    transitionedBy: t.relation("transitionedBy", { nullable: true }),
  }),
});
