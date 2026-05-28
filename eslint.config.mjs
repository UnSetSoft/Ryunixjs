import _import from 'eslint-plugin-import'
import { fixupPluginRules } from '@eslint/compat'
import globals from 'globals'
import babelParser from '@babel/eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.vscode/**',
      '**/.turbo/**',
      '**/.ryunix/**',
      '**/dist/**',
      '**/.generated/**',
      '**/out/**',
      'test/**',
      '_ci/**',
      'packages/ryunix-vscode/syntaxes/**',
      'packages/ryunix-vscode/test/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ryx}'],
    plugins: {
      import: fixupPluginRules(_import),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        ...globals.jest,
      },

      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,

        ecmaFeatures: {
          jsx: true,
        },

        babelOptions: {
          presets: ['@babel/preset-react'],
          caller: {
            supportsTopLevelAwait: true,
          },
        },
      },
    },

    rules: {
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: fixupPluginRules(_import),
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        ...globals.jest,
      },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
    },
  },
]
