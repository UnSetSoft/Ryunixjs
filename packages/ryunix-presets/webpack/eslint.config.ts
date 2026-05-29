import { defineConfig } from 'eslint/config'
import config from './utils/config.js'
import {
  projectHasTsConfig,
  resolveEslintFilePatterns,
} from './utils/eslint-files.js'

/**
 * ESLint Configuration for Ryunix
 *
 * NOTE ABOUT MDX:
 * .mdx and .md files are excluded from ESLint due to compatibility issues
 * between eslint-plugin-mdx and ESM/flat config.
 *
 * Typed `.ryx` (projects with `tsconfig.json`) is compiled as TypeScript; ESLint
 * uses the JS parser only for `.js`/`.jsx`/`.ts` here — use `tsc` for `.ryx`.
 */
const projectRoot = process.cwd()
const eslintFiles = resolveEslintFilePatterns(
  projectRoot,
  config?.eslint?.files ?? ['**/*.ryx'],
)
const lintRyxAsJs =
  eslintFiles.some((f) => /ryx/i.test(f)) && !projectHasTsConfig(projectRoot)

const eslintConfig = defineConfig([
  {
    files: eslintFiles,

    ignores: ['**/*.mdx', '**/*.md', '**/node_modules/**'],

    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ...(lintRyxAsJs ? { extraFileExtensions: ['.ryx'] } : {}),
      },
    },
    settings: {
      react: {
        pragma: 'Ryunix.createElement',
        fragment: 'Ryunix.Fragment',
      },
    },
    plugins: config?.eslint?.plugins as never,
    rules: config?.eslint?.rules as never,
  },
])

export default eslintConfig
