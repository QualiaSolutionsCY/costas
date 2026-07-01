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
  {
    // Post-mount sync from localStorage / props is a deliberate, React-blessed
    // pattern here (LanguageProvider, ServiceLog, MechanicLog, SplashGate). The
    // upgraded react-hooks rule flags it as an error; keep it visible as a
    // warning rather than a deploy-blocker.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
