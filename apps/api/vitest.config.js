import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    testTimeout: 30000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://dbadmin:dbadmin@localhost:5432/boilerworks",
    },
  },
});
//# sourceMappingURL=vitest.config.js.map
