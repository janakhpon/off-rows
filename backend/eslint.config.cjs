const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    ...js.configs.recommended,
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "no-undef": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      "no-unused-labels": "off",
      "no-unused-expressions": "off",
    },
  },
];
