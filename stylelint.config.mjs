export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-standard-scss",
    "stylelint-config-recommended-vue",
  ],
  rules: {
    "declaration-empty-line-before": null,
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "apply", "layer", "config", "screen"],
      },
    ],
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "apply", "layer", "config", "screen"],
      },
    ],
  },
  ignoreFiles: ["dist/**", "node_modules/**"],
};
