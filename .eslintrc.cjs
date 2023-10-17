/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
  reportUnusedDisableDirectives: true,
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: ['./**/*.cjs'],
    },
  ],
};
