import type { RuleCondition, RuleDefinition } from "./rules.types";

/**
 * Evaluate a single condition against a data record.
 */
export function evaluateCondition(
  condition: RuleCondition,
  data: Record<string, unknown>,
): boolean {
  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "gt":
      return typeof fieldValue === "number" && fieldValue > (condition.value as number);
    case "lt":
      return typeof fieldValue === "number" && fieldValue < (condition.value as number);
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(condition.value as string);
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case "not_in":
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case "is_empty":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";
    case "is_not_empty":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    default:
      return false;
  }
}

/**
 * Evaluate all conditions in a rule (AND logic).
 */
export function evaluateRule(
  rule: RuleDefinition,
  data: Record<string, unknown>,
): boolean {
  return rule.conditions.every((condition) => evaluateCondition(condition, data));
}

/**
 * Evaluate all rules for a model + trigger and return matched ones.
 */
export function evaluateRules(
  rules: RuleDefinition[],
  model: string,
  trigger: string,
  data: Record<string, unknown>,
): RuleDefinition[] {
  return rules
    .filter((rule) => rule.isEnabled && rule.model === model && rule.trigger === trigger)
    .filter((rule) => evaluateRule(rule, data));
}
