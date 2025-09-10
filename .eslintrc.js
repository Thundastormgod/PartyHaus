module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  settings: { react: { version: 'detect' } },
  env: { browser: true, node: true, es6: true, jest: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
