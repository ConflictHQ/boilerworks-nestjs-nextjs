import { defineConfig } from "vitest/config";

/**
 * The web app's tests, in a browser-like DOM. Stories render through the
 * catalog's own preview (.storybook/preview.tsx); the components they show
 * take the path and the person as props, so no Next.js router is needed.
 */
export default defineConfig({
  resolve: { alias: { "@": import.meta.dirname } },
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "storybook-static/**"],
    setupFiles: ["./ui-app/test/setup.ts"],
    // The a11y addon fails a story with violations only in a standalone
    // Vitest run, which it detects through this variable.
    env: { VITEST_STORYBOOK: "false" },
    server: { deps: { inline: ["@storybook/addon-a11y"] } },
  },
});
