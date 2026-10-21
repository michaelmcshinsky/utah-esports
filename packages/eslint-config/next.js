import base from "./react.js";

/** Flat config for Next.js apps. */
export default [
  ...base,
  {
    ignores: [".next/**", "out/**"],
  },
];
