module.exports = {
  "*.(md|json|graphql)": "prettier --write",
  "./package.json": [
    () => "syncpack list-mismatches",
    () => "syncpack format",
    "prettier --write",
  ],
  "packages/**/package.json": [() => "syncpack format", "prettier --write"],

  ...["src"].reduce((actions, pkg) => {
    actions[`${pkg}/**/*.{cjs,mjs,js,jsx,ts,tsx}`] = [
      // "eslint --fix",
      () => `tsc --project ./${pkg}/tsconfig.json --noEmit`,
      "prettier --write",
    ];
    return actions;
  }, {}),
};
