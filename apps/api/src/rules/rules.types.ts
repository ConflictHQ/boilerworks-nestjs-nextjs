import { builder } from "../graphql/builder";

// Rule definition stored in DB as JSON
export type RuleCondition = {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "gt"
    | "lt"
    | "contains"
    | "in"
    | "not_in"
    | "is_empty"
    | "is_not_empty";
  value?: unknown;
};

export type RuleAction = {
  type:
    | "send_email"
    | "notify_user"
    | "call_webhook"
    | "update_field"
    | "enqueue_job";
  to?: string;
  subject?: string;
  message?: string;
  url?: string;
  field?: string;
  value?: unknown;
};

export type RuleDefinition = {
  name: string;
  model: string;
  trigger: "create" | "update" | "delete" | "field_change";
  conditions: RuleCondition[];
  actions: RuleAction[];
  isEnabled: boolean;
};

const RuleResult = builder.simpleObject("RuleEvaluationResult", {
  fields: (t) => ({
    ruleName: t.string(),
    matched: t.boolean(),
    actionsTriggered: t.int(),
  }),
});

builder.queryField("evaluateRules", (t) =>
  t.field({
    type: [RuleResult],
    args: {
      model: t.arg.string({ required: true }),
      trigger: t.arg.string({ required: true }),
      data: t.arg({ type: "JSON", required: true }),
    },
    resolve: async (_root, args, _ctx) => {
      // Rule evaluation is a placeholder — rules would be stored in DB
      // and evaluated against the incoming data
      console.log(`[Rules] Evaluating rules for ${args.model}:${args.trigger}`);
      return [];
    },
  }),
);
