const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/_lib/**", "src/js/form-logic.js", ".eleventy.js"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
    },
  },
});
