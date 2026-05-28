# Tech stack and monorepo scripts

> **Language / Idioma:** [English](./tech-stack-and-scripts.md) ·
> [Español](../../es/guias/pila-tecnologica-y-scripts.md)

Reference for **technologies used in the RyunixJS monorepo** and for
**root-level `pnpm` scripts**. It does not replace package-specific deep dives
under `docs/en/core/`, `docs/en/ryunix-presets/`, or `docs/en/cra/`.

> **Note:** This page was produced with AI assistance and cross-checked against
> `package.json` files, `turbo.json`, and `pnpm-workspace.yaml` in the
> repository.

**Last reviewed:** 2026-05-23

---

## Table of contents

- [Tech stack and monorepo scripts](#tech-stack-and-monorepo-scripts)
  - [Table of contents](#table-of-contents)
  - [Scope](#scope)
  - [Monorepo layout](#monorepo-layout)
  - [Technologies by area](#technologies-by-area)
  - [Root scripts (`package.json`)](#root-scripts-packagejson)
  - [Per-package scripts (summary)](#per-package-scripts-summary)
  - [Related documentation](#related-documentation)

---

## Scope

| In scope                                         | Out of scope                                           |
| :----------------------------------------------- | :----------------------------------------------------- |
| Languages, runtimes, and major libraries by area | Step-by-step tutorials for each tool                   |
| Root `package.json` scripts and Turbo tasks      | Every flag of `ryunix` or Webpack                      |
| Per-package scripts at a summary level           | `../ryunix-doc` (workspace) and local `test/*` scratch |

For onboarding and folder layout, see
[repository-guide.md](./repository-guide.md). For how to run tests and
`pnpm run:web`, see [local-integration-app.md](./local-integration-app.md).

---

## Monorepo layout

| Package                    | npm name                     | Role                                             |
| :------------------------- | :--------------------------- | :----------------------------------------------- |
| `packages/core`            | `@unsetsoft/ryunixjs`        | UI runtime (VDOM, reconciler, hooks, SSR APIs)   |
| `packages/ryunix-presets`  | `@unsetsoft/ryunix-presets`  | `ryunix` CLI, Webpack, routing, SSG, API compile |
| `packages/cra`             | `@unsetsoft/cra`             | `npx @unsetsoft/cra` scaffolder and templates    |
| `packages/ryunix-devtools` | `@unsetsoft/ryunix-devtools` | Chrome extension (Manifest V3)                   |

**Workspace tooling:** [pnpm](https://pnpm.io/) workspaces
(`pnpm-workspace.yaml`) and [Turborepo](https://turbo.build/) (`turbo.json`)
orchestrate `dev`, `build`, `test`, `lint`, and `clean` across packages.

**Engines (root):** Node.js `>=18`; pnpm `>=8` (repo pins `pnpm@10.26.0` via
`packageManager`). Core and presets recommend Node `20`, `22`, or `24`.

---

## Technologies by area

### Runtime (`@unsetsoft/ryunixjs`)

| Aspect                  | Technology                                                                   |
| :---------------------- | :--------------------------------------------------------------------------- |
| Published runtime       | Plain JavaScript (ESM + UMD bundles via Rollup)                              |
| Production dependencies | **None** (`dependencies` is empty in `packages/core`)                        |
| JSX                     | Custom runtime under `packages/core/jsx/` (`jsx-runtime`, `jsx-dev-runtime`) |
| Tests                   | Jest 30 + `jest-environment-jsdom`, `babel-jest`                             |

The framework shipped to npm does not bundle React or Preact.

### Build and app tooling (`@unsetsoft/ryunix-presets`)

| Area                           | Technologies                                                                                   |
| :----------------------------- | :--------------------------------------------------------------------------------------------- |
| Bundler                        | **Webpack 5** (client + server configs), `webpack-dev-server`, `webpack-cli`                   |
| Transpilation                  | **Babel 7** (`preset-env`, `preset-react`, JSX plugin), **SWC** (`@swc/core`, `swc-loader`)    |
| Alt. bundler (present in deps) | **Vite 8**, `@vitejs/plugin-react-swc`                                                         |
| Library build (core only)      | **Rollup 4**                                                                                   |
| MDX / markdown                 | `@mdx-js/loader`, `@mdx-js/rollup`, **remark** / **rehype** plugins                            |
| Styles                         | **PostCSS**, **Sass**, `css-loader`, `mini-css-extract-plugin`, `css-minimizer-webpack-plugin` |
| CLI                            | `yargs`, `chalk`, `boxen`; binary `ryunix` → `webpack/bin/index.mjs`                           |
| Lint in toolchain              | ESLint 9, `eslint-webpack-plugin`, `eslint-plugin-mdx`                                         |

Apps created with CRA templates consume `@unsetsoft/ryunix-presets` and
`@unsetsoft/ryunixjs` (see `packages/cra/templates/`).

### Scaffolding (`@unsetsoft/cra`)

| Area   | Technologies                                                                       |
| :----- | :--------------------------------------------------------------------------------- |
| CLI    | **Commander**, **prompts**, `cross-spawn`, `command-exists-promise`, `picocolors`  |
| Output | Copied templates (`ryunix-base`, `ryunix-tailwind`, `ryunix-eslint`, `ryunix-all`) |

### Browser DevTools (`@unsetsoft/ryunix-devtools`)

| Area        | Technologies                                                      |
| :---------- | :---------------------------------------------------------------- |
| Extension   | Chromium extension (Manifest V3); no npm runtime deps             |
| Integration | Communicates with Ryunix apps in the browser (see package README) |

### Monorepo development (repository root)

| Area               | Technologies                                                                        |
| :----------------- | :---------------------------------------------------------------------------------- |
| Package manager    | **pnpm** 10 (workspaces, `workspace:*` overrides)                                   |
| Task runner        | **Turbo** 2.8                                                                       |
| Lint               | **ESLint** 9 (flat config `eslint.config.mjs`), TypeScript ESLint plugins           |
| Format             | **Prettier** 3.7                                                                    |
| Markdown           | **markdownlint-cli2** (config: `.markdownlint.json`, `.markdownlint-cli2.jsonc`)    |
| Tests (root)       | Jest / jsdom (used mainly from `packages/core`)                                     |
| Cross-platform env | `cross-env` (e.g. `NODE_OPTIONS` for `run:web`)                                     |
| Releases           | `@kagarisoft/gmvu-cli` (`kg:init`, `kg:bump`), `commit-and-tag-version` (changelog) |

### Typical stack in generated Ryunix apps

Not part of this monorepo’s `package.json`, but reflected in official templates:

| Area        | Usual choice                                                     |
| :---------- | :--------------------------------------------------------------- |
| UI          | `@unsetsoft/ryunixjs`                                            |
| CLI / build | `@unsetsoft/ryunix-presets` (`ryunix dev`, `build`, `start`)     |
| Config      | `ryunix.config.js`, `app/*.ryx`, optional `app/api/**/router.js` |
| Optional    | Tailwind / ESLint template variants via CRA flags                |

---

## Root scripts (`package.json`)

Commands are run from the **repository root** unless noted.

### Day-to-day development

| Script                  | Purpose                                                                |
| :---------------------- | :--------------------------------------------------------------------- |
| `pnpm install`          | Install all workspace dependencies                                     |
| `pnpm run dev`          | Turbo: run `dev` in packages that define it (e.g. CRA interactive CLI) |
| `pnpm run build`        | Turbo: build packages (`dependsOn: ^build`)                            |
| `pnpm run test`         | Turbo: run tests (after build)                                         |
| `pnpm run lint`         | ESLint on repo + Turbo `lint` + `lint:md`                              |
| `pnpm run lint:fix`     | Prettier, ESLint `--fix`, Turbo lint fix                               |
| `pnpm run format`       | Prettier write on the repo                                             |
| `pnpm run format:check` | Prettier check only                                                    |
| `pnpm run lint:md`      | Markdownlint on `docs/`, root `*.md`, `packages/*/README.md`           |
| `pnpm run lint:md:fix`  | Markdownlint `--fix` + Prettier on Markdown                            |
| `pnpm run clean`        | Turbo `clean` + remove root `node_modules`                             |

### Local integration app (framework in the browser)

| Script                   | Purpose                                              |
| :----------------------- | :--------------------------------------------------- |
| `pnpm run run:web`       | Alias of `dev:doc` (`ryunix dev` on `../ryunix-doc`) |
| `pnpm run run:web:build` | Production build of that app                         |
| `pnpm run run:web:start` | `ryunix start` for the built app                     |

Root `pnpm run dev` does **not** start the Webpack test app; `run:web` is the
equivalent of `pnpm dev` in a Ryunix application.

### Versioning and publish

| Script                    | Purpose                                                   |
| :------------------------ | :-------------------------------------------------------- |
| `pnpm run kg:init`        | Initialize GMVU versioning metadata                       |
| `pnpm run kg:bump`        | Bump versions (GMVU)                                      |
| `pnpm run release:canary` | Bump, format, publish core `@canary`                      |
| `pnpm run release:stable` | Bump, format, publish core stable                         |
| `pnpm run cra:release`    | Publish `@unsetsoft/cra` stable                           |
| `pnpm run cra:nightly`    | Publish CRA with `nightly` tag                            |
| `pnpm run publish:all`    | Publish workspace packages (excludes `test/**`, devtools) |
| `pnpm run publish:canary` | Same with npm tag `canary`                                |
| `pnpm run changelog`      | Generate changelog (`commit-and-tag-version`)             |
| `pnpm run git:push`       | `git push --follow-tags origin`                           |

### Turbo tasks (summary)

Defined in `turbo.json`: `build`, `test`, `lint`, `dev` (persistent, no cache),
`clean`, `canary:release`, `release`, `nightly:release`. Package scripts must
exist for Turbo to run them.

---

## Per-package scripts (summary)

| Package                      | Main scripts                                                                                            |
| :--------------------------- | :------------------------------------------------------------------------------------------------------ |
| `@unsetsoft/ryunixjs`        | `build` (Rollup), `test` (Jest), `lint`, `prettier-check` / `prettier-fix`, `canary:release`, `release` |
| `@unsetsoft/ryunix-presets`  | (no `scripts` in package.json; consumed via `ryunix` bin)                                               |
| `@unsetsoft/cra`             | `dev` (local CLI), `release`, `nightly:release`                                                         |
| `@unsetsoft/ryunix-devtools` | (none; load unpacked in Chrome)                                                                         |

---

## Related documentation

| Topic                       | Document                                               |
| :-------------------------- | :----------------------------------------------------- |
| Monorepo onboarding         | [repository-guide.md](./repository-guide.md)           |
| Automated tests             | [automated-testing.md](./automated-testing.md)         |
| Integration app (`run:web`) | [local-integration-app.md](./local-integration-app.md) |
| Doc index                   | [overview.md](../overview.md)                          |
| Contributing / PR checks    | [CONTRIBUTING.md](../../CONTRIBUTING.md)               |
