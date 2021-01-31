module.exports = {
    root: true,
    env: {
      node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 6,
      sourceType: "module",
    },
    plugins: [
        '@typescript-eslint',
      ],
      extends: ['eslint:recommended',
      'plugin:@typescript-eslint/recommended',],
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  };
  