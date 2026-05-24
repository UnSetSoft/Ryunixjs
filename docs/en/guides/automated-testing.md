# Automated tests and code quality

> **Language / Idioma:** [English](./automated-testing.md) ·
> [Español](../../es/guias/tests-automatizados.md)

**CI and terminal** checks (Jest, lint, build) without opening a full Ryunix
application. To see monorepo changes in the browser via a real linked app, use
the separate guide:
[local integration app](./local-integration-app.md).

| Path | Guide |
| :--- | :---- |
| Automated tests (this document) | Jest in `packages/core`, `pnpm test`, `pnpm lint` |
| Local integration app | [local-integration-app.md](./local-integration-app.md) |

---

## Table of contents

- [Automated tests and code quality](#automated-tests-and-code-quality)
  - [Table of contents](#table-of-contents)
  - [Summary by package](#summary-by-package)
  - [Requirements](#requirements)
  - [Global commands](#global-commands)
  - [Before opening a PR](#before-opening-a-pr)
  - [`@unsetsoft/ryunixjs` (`packages/core`)](#unsetsoftryunixjs-packagescore)
  - [`@unsetsoft/cra` (`packages/cra`)](#unsetsoftcra-packagescra)
  - [Packages without Jest](#packages-without-jest)
  - [Related documentation](#related-documentation)

---

## Summary by package

| Package / scope | Path | Automated tests | Main command |
| :-------------- | :--- | :-------------- | :----------- |
| `@unsetsoft/ryunixjs` | `packages/core` | **Yes** (Jest + jsdom) | `pnpm --filter @unsetsoft/ryunixjs test` |
| `@unsetsoft/ryunix-presets` | `packages/ryunix-presets` | No | [Integration app](./local-integration-app.md) |
| `@unsetsoft/cra` | `packages/cra` | No | Manual CLI (see below) |
| `@unsetsoft/ryunix-devtools` | `packages/ryunix-devtools` | No | [Integration app](./local-integration-app.md) |
| **Monorepo (root)** | `/` | Turbo runs core `test` | `pnpm test`, `pnpm lint`, `pnpm build` |

The only package with a Jest suite is `@unsetsoft/ryunixjs` (`packages/core`).

---

## Requirements

- **Node.js**: 20, 22, or 24 (recommended >= 22; see `CONTRIBUTING.md`).
- **pnpm**: v10+ (`packageManager` at the repo root).
- After cloning: `pnpm install` at the monorepo root.

---

## Global commands

| Command | What it does |
| :------ | :----------- |
| `pnpm install` | Installs dependencies for all workspaces. |
| `pnpm build` | Builds packages (Turbo; `build` depends on `^build`). |
| `pnpm test` | Runs `test` in packages that define it (today: **core** only). Turbo requires `build` first. |
| `pnpm lint` | Root ESLint + per-package `lint` via Turbo. |
| `pnpm lint:fix` | Fixes lint and formats with Prettier. |
| `pnpm run lint:md` | Markdownlint on `docs/`, root `*.md`, and package READMEs. |

The `pnpm run:web*` commands are not automated tests; see
[local-integration-app.md](./local-integration-app.md).

---

## Before opening a PR

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `canary` and
`main`:

| Job | Checks |
| :-- | :----- |
| **quality** (Node 20 & 22) | `pnpm run build:core`, `pnpm test`, `pnpm lint`, `pnpm lint:md`, `pnpm format:check` |
| **smoke-app** | Scaffold `ryunix-base` with `workspace:*` and `ryunix build` (`scripts/ci-smoke-build.mjs`) |

Only `@unsetsoft/ryunixjs` is built in CI; `@unsetsoft/ryunix-presets` has no
build script.

Publishing: `.github/workflows/release.yml` uses **npm Trusted Publishing (OIDC)**
and provenance (no `NPM_TOKEN`). Configure Trusted Publisher on npmjs.com per
package with workflow `release.yml` — see `CONTRIBUTING.md`.

---

## `@unsetsoft/ryunixjs` (`packages/core`)

UI engine: reconciler, hooks, render. This is the **only package with unit
tests** in the monorepo.

### Stack

- **Jest** 30 + **babel-jest** + **jest-environment-jsdom**
- Config: `packages/core/jest.config.cjs`
- Global setup: `packages/core/jest.setup.js` (polyfills for
  `requestIdleCallback` / `cancelIdleCallback`)
- Tests: `packages/core/src/tests/**/*.test.js`
- Babel: `packages/core/babel.config.json`

### Run core tests only

```bash
# From the repo root (recommended)
pnpm --filter @unsetsoft/ryunixjs test

# From the package
cd packages/core && pnpm test
```

Watch mode (development):

```bash
cd packages/core
pnpm exec jest --testPathPattern=src --watch
```

### Writing a new test

1. Create `packages/core/src/tests/<name>.test.js`.
2. Import from `../lib/...` (source, not `dist/`).
3. Use `workLoop({ timeRemaining: () => 100 })` after actions that trigger
   async reconciler updates.
4. Mount in a container with `Ryunix.init()` and a `div` on `document.body`
   (see the reference test).

Existing example: `packages/core/src/tests/TestComponent.test.js` (`useStore`
hook and DOM updates).

### Current limitations

- No SSR/SSG integration tests in core; validate those in the
  [local integration app](./local-integration-app.md).
- Error `jest: command not found`: run `pnpm install` at the root.

---

## `@unsetsoft/cra` (`packages/cra`)

`npx @unsetsoft/cra` scaffolder. **No automated tests** in the CRA package;
validation is **manual** when running the generator.

### Run the CLI from the monorepo

```bash
pnpm --filter @unsetsoft/cra dev

# Or directly with Node
node packages/cra/src/cli.js ../_cra/my-test-app --latest
```

To avoid mixing with the integration app, use a folder outside `test/` (e.g.
`_cra/`, also in `.gitignore`).

### What to validate (generator)

| Step | Check |
| :--- | :---- |
| Generation | Template copied (`ryunix-base`, `--tailwind`, `--eslint`, etc.) |
| `package.json` | `@unsetsoft/ryunixjs` and `@unsetsoft/ryunix-presets` resolve |
| Install | The wizard runs the chosen package manager without errors |
| Generated app | `pnpm dev` starts with `ryunix dev` |

Docs: [CLI and helpers](../cra/cli-and-helpers.md),
[Template generation](../cra/template-generation.md).

---

## Packages without Jest

| Package | Automated tests | Where to validate changes |
| :------ | :-------------- | :-------------------------- |
| `@unsetsoft/ryunix-presets` | No | [Integration app](./local-integration-app.md) — routing, build, SSR |
| `@unsetsoft/ryunix-devtools` | No | [Integration app](./local-integration-app.md) — extension + Chrome |

---

## Related documentation

| Topic | Link |
| :---- | :--- |
| Local integration app | [local-integration-app.md](./local-integration-app.md) |
| Repository guide | [repository-guide.md](./repository-guide.md) |
| Tech stack and scripts | [tech-stack-and-scripts.md](./tech-stack-and-scripts.md) |
| Contributing | [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Docs index | [overview.md](../overview.md) |
