const stylistic = require('@stylistic/eslint-plugin');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const controlFlow = ['if', 'for', 'while', 'do', 'switch', 'try'];

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/**', 'coverage/**'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      curly: ['error', 'all'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: true },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: { regex: '^T[A-Z]', match: true },
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'never', prev: 'import', next: 'import' },
        {
          blankLine: 'always',
          prev: ['type', 'interface'],
          next: ['type', 'interface'],
        },
        { blankLine: 'always', prev: '*', next: [...controlFlow, 'return'] },
        { blankLine: 'always', prev: controlFlow, next: '*' },
      ],
    },
  },
]);
