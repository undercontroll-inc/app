const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const globals = require("globals");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*", ".expo/*", "mock/db.runtime.json", "coverage/*"],
  },
  {
    rules: {
      "no-use-before-define": ["error", { functions: false, classes: true, variables: false }],
    },
  },
  {
    files: ["mock/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/__tests__/**/*.{js,jsx}", "test/**/*.{js,jsx}", "jest.setup.js"],
    languageOptions: { globals: globals.jest },
  },
]);
