import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules for stricter type safety
  {
    rules: {
      // Warn on explicit any usage (aim to remove over time)
      "@typescript-eslint/no-explicit-any": "warn",
      // Encourage explicit return types on exported functions
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Prevent unused variables
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Prefer const over let when possible
      "prefer-const": "warn",
      // No console in production (use logger instead)
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  },
]);

export default eslintConfig;
