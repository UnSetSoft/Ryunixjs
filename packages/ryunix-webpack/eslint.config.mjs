import config from './utils/config.cjs'
import { resolveApp } from './utils/index.mjs'
import { defineConfig } from 'eslint/config'
const dir = process.cwd()

const eslintConfig = defineConfig([
  {
    files: ['**/*.ryx', ...config?.eslint?.files],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        extraFileExtensions: ['.ryx'],
      },
    },
    settings: {
      react: {
        pragma: 'Ryunix.createElement', // Para JSX transpile a Ryunix.createElement
        fragment: 'Ryunix.Fragment', // Para fragmentos JSX
      },
    },
    plugins: config?.eslint?.plugins,
    rules: config?.eslint?.rules,
  },
])

export default eslintConfig
