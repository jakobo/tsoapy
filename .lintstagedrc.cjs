module.exports = {
  "*.(md|json|graphql)": "prettier --write",
  "./package.json": [
    () => "syncpack list-mismatches",
    () => "syncpack format",
    "prettier --write",
  ],

  "./src/**/*.{cjs,mjs,js,jsx,ts,tsx}": [
    "eslint --fix",
    () => `tsc --project ./tsconfig.json --noEmit`,
    "prettier --write",
  ],
};
