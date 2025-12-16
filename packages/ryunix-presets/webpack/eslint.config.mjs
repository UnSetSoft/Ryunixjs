import config from './utils/config.cjs'
import { defineConfig } from 'eslint/config'

/**
 * ESLint Configuration for Ryunix
 * 
 * NOTE ABOUT MDX:
 * .mdx and .md files are excluded from ESLint due to compatibility issues
 * between eslint-plugin-mdx and ESM/flat config.
 * 
 * Error: “Could not find ESLint Linter in require cache”
 * 
 * MDX files are validated during compilation by @mdx-js/loader,
 * which is sufficient for detecting syntax and JSX errors.
 */
const eslintConfig = defineConfig([
  {

    files: ['**/*.ryx', ...config?.eslint?.files],

    ignores: ['**/*.mdx', '**/*.md', '**/node_modules/**'],

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
        pragma: 'Ryunix.createElement',
        fragment: 'Ryunix.Fragment',
      },
    },
    plugins: config?.eslint?.plugins,
    rules: config?.eslint?.rules,
  },
])

export default eslintConfig
