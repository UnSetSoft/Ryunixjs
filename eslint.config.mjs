import _import from 'eslint-plugin-import'
import { fixupPluginRules } from '@eslint/compat'
import globals from 'globals'
import babelParser from '@babel/eslint-parser'

export default [
  {
    ignores: ['**/node_modules', '**/.vscode/**/*'],
  },
  {
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
]
