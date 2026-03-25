import { GraphQLError } from "graphql";

function envBool(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val === "true" || val === "1";
}

export const features = {
  forms: envBool("FEATURE_FORMS", true),
  workflows: envBool("FEATURE_WORKFLOWS", true),
  search: envBool("FEATURE_SEARCH", false),
  temporal: envBool("FEATURE_TEMPORAL", false),
};

export type FeatureName = keyof typeof features;

/**
 * Guard — throws if a feature is disabled.
 * Use at the top of any feature-gated resolver.
 */
export function requireFeature(name: FeatureName) {
  if (!features[name]) {
    throw new GraphQLError(`Feature "${name}" is not enabled`, {
      extensions: { code: "FEATURE_DISABLED" },
    });
  }
}

/**
 * Check if a feature is enabled (non-throwing).
 */
export function isFeatureEnabled(name: FeatureName): boolean {
  return features[name];
}
