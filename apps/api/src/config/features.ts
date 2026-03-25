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
