import base from "@utah-esports/eslint-config/next";

export default [
  ...base,
  {
    files: ["scripts/**"],
    languageOptions: {
      globals: { process: "readonly" },
    },
  },
  {
    ignores: [".next/**", "out/**"],
  },
];
