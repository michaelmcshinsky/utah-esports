import base from "@utah-esports/eslint-config/next";

export default [
  ...base,
  {
    ignores: [".next/**", "out/**"],
  },
];
