# Create Ryunix App: CLI & Helpers

The `@unsetsoft/create-ryunix-app` package functions as the primary scaffolding
gateway.

---

## Table of contents

- [Create Ryunix App: CLI & Helpers](#create-ryunix-app-cli--helpers)
  - [Table of contents](#table-of-contents)
  - [1. CLI Arguments & Prompts (`cli.js`)](#1-cli-arguments--prompts-clijs)
  - [2. The Core Execution Engine (`create-app.js`)](#2-the-core-execution-engine-create-appjs)
  - [3. Terminal Executions (`commands.js`)](#3-terminal-executions-commandsjs)

---

## 1. CLI Arguments & Prompts (`cli.js`)

Builds entirely upon Node `commander` and `prompts` interactive terminal
libraries.

- Intercepts implicit shell arguments (`--tailwind`, `--canary`,

  `--compiler=swc`).

- If omitted, gracefully falls back to interactive Terminal choices querying the

  developer safely avoiding installation failures.

- Captures the exact target project directory naming structure.

## 2. The Core Execution Engine (`create-app.js`)

The `createApp` function orchestrates the physical folder deployments.

- **Dependency Resolvers**: Instead of hardcoding static versions natively

  (which age out), it executes dynamic shell queries (`npm view`, `yarn info`)
  inspecting the NPM Registry explicitly pulling the absolute latest strict
  semantic version representing the chosen `--latest` or `--canary` tags for
  both `@unsetsoft/ryunixjs` and `@unsetsoft/ryunix-presets`.

- **Target Routing**: Determines exactly which of the 4 native `templates` to

  physically copy (`ryunix-base`, `ryunix-eslint`, `ryunix-tailwind`, or
  `ryunix-all`) leveraging `copyRecursiveSync`.

- **Configuration Modifications**: Statically mutates the generated

  `package.json` mutating the generic `name` into the explicit developer folder
  name. If `--compiler` was modified, it injects string replacements physically
  directly into `ryunix.config.js`.

- **VSCode Automation**: Optionally writes `.vscode/extensions.json` forcing the

  Editor to recommend the physical `unsetsoft.ryunixjs` syntax highlighting
  addon natively.

## 3. Terminal Executions (`commands.js`)

Houses raw OS-level execution shells checking if binary configurations exist
(e.g. `code` executing VS Code Native extension installations out-of-band
natively).
