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
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: [...controlFlow, 'return'] },
        { blankLine: 'always', prev: controlFlow, next: '*' },
      ],
    },
  },
]);
