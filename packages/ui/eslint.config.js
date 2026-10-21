import base from "@utah-esports/eslint-config/react";

export default [
  ...base,
  {
    rules: {
      // False positives: named exports from CJS-built libs (testing-library)
      // and component wrappers that receive children via props.
      "import/named": "off",
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/label-has-associated-control": "off",
    },
  },
];
