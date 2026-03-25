import { describe, it, expect } from "vitest";
import { evaluateCondition, evaluateRule, evaluateRules } from "./rule-engine";
import type { RuleDefinition } from "./rules.types";

describe("Rule Engine", () => {
  describe("evaluateCondition", () => {
    it("equals", () => {
      expect(evaluateCondition({ field: "status", operator: "equals", value: "active" }, { status: "active" })).toBe(true);
      expect(evaluateCondition({ field: "status", operator: "equals", value: "active" }, { status: "draft" })).toBe(false);
    });

    it("not_equals", () => {
      expect(evaluateCondition({ field: "status", operator: "not_equals", value: "draft" }, { status: "active" })).toBe(true);
    });

    it("gt / lt", () => {
      expect(evaluateCondition({ field: "amount", operator: "gt", value: 100 }, { amount: 150 })).toBe(true);
      expect(evaluateCondition({ field: "amount", operator: "lt", value: 100 }, { amount: 50 })).toBe(true);
    });

    it("contains", () => {
      expect(evaluateCondition({ field: "name", operator: "contains", value: "test" }, { name: "test user" })).toBe(true);
    });

    it("in / not_in", () => {
      expect(evaluateCondition({ field: "status", operator: "in", value: ["active", "pending"] }, { status: "active" })).toBe(true);
      expect(evaluateCondition({ field: "status", operator: "not_in", value: ["draft"] }, { status: "active" })).toBe(true);
    });

    it("is_empty / is_not_empty", () => {
      expect(evaluateCondition({ field: "name", operator: "is_empty" }, { name: "" })).toBe(true);
      expect(evaluateCondition({ field: "name", operator: "is_not_empty" }, { name: "hello" })).toBe(true);
    });
  });

  describe("evaluateRule", () => {
    it("matches when all conditions pass (AND)", () => {
      const rule: RuleDefinition = {
        name: "High value active",
        model: "Invoice",
        trigger: "create",
        conditions: [
          { field: "amount", operator: "gt", value: 1000 },
          { field: "status", operator: "equals", value: "active" },
        ],
        actions: [],
        isEnabled: true,
      };

      expect(evaluateRule(rule, { amount: 5000, status: "active" })).toBe(true);
      expect(evaluateRule(rule, { amount: 500, status: "active" })).toBe(false);
      expect(evaluateRule(rule, { amount: 5000, status: "draft" })).toBe(false);
    });
  });

  describe("evaluateRules", () => {
    const rules: RuleDefinition[] = [
      {
        name: "Notify on high value",
        model: "Invoice",
        trigger: "create",
        conditions: [{ field: "amount", operator: "gt", value: 10000 }],
        actions: [{ type: "notify_user", to: "admin" }],
        isEnabled: true,
      },
      {
        name: "Disabled rule",
        model: "Invoice",
        trigger: "create",
        conditions: [{ field: "amount", operator: "gt", value: 0 }],
        actions: [],
        isEnabled: false,
      },
      {
        name: "Different model",
        model: "Order",
        trigger: "create",
        conditions: [{ field: "total", operator: "gt", value: 0 }],
        actions: [],
        isEnabled: true,
      },
    ];

    it("filters by model, trigger, and enabled", () => {
      const matched = evaluateRules(rules, "Invoice", "create", { amount: 50000 });
      expect(matched.length).toBe(1);
      expect(matched[0].name).toBe("Notify on high value");
    });

    it("returns empty when no conditions match", () => {
      const matched = evaluateRules(rules, "Invoice", "create", { amount: 100 });
      expect(matched.length).toBe(0);
    });

    it("ignores disabled rules", () => {
      const matched = evaluateRules(rules, "Invoice", "create", { amount: 1 });
      expect(matched.length).toBe(0);
    });
  });
});
