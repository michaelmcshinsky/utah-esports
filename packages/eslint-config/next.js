import base from "./react.js";
import nextPlugin from "@next/eslint-plugin-next";

/** Flat config for Next.js apps. */
export default [
  ...base,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: [".next/**", "out/**"],
  },
];
