const fs = require('fs')
const path = require('path')

const enableEslint = (projectPath) => {
  // 1. Write a basic .eslintrc.json for Ryunix
  const eslintConfig = {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
    ],
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['react', 'react-hooks'],
    rules: {
      // Ryunix specific rules (e.g. global Ryunix shouldn't trigger undef if imported natively, but we default to standard react rules)
      'react/react-in-jsx-scope': 'off', // Ryunix handles JSX mapping automatically via compiler
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  }

  fs.writeFileSync(
    path.join(projectPath, '.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  )

  // 2. Add minimal .eslintignore
  const eslintIgnore = `node_modules
.ryunix
dist
build
`
  fs.writeFileSync(path.join(projectPath, '.eslintignore'), eslintIgnore)
}

module.exports = { enableEslint }
