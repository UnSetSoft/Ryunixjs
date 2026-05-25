# TypeScript in the RyunixJS monorepo

> **Language / Idioma:** [English](./typescript-in-the-monorepo.md) ·
> [Español](../../es/guias/typescript-en-el-monorepo.md)

Reference for **how TypeScript is set up in this repository**: shared config,
scripts, published types for npm consumers, and maintainer source in TypeScript.
It complements package READMEs and
[tech-stack-and-scripts.md](./tech-stack-and-scripts.md).

**Last reviewed:** 2026-05-24

---

## Table of contents

- [TypeScript in the RyunixJS monorepo](#typescript-in-the-ryunixjs-monorepo)
  - [Table of contents](#table-of-contents)
  - [Scope](#scope)
  - [Two goals](#two-goals)
  - [Migration phases (maintainers)](#migration-phases-maintainers)
  - [What remains in JavaScript](#what-remains-in-javascript)
  - [Shared infrastructure (root)](#shared-infrastructure-root)
  - [Per-package layout](#per-package-layout)
  - [Scripts](#scripts)
  - [CI and before a PR](#ci-and-before-a-pr)
  - [TypeScript in Ryunix apps (end users)](#typescript-in-ryunix-apps-end-users)
  - [Related documentation](#related-documentation)

---

## Scope

| In scope                                                   | Out of scope                                                  |
| :--------------------------------------------------------- | :------------------------------------------------------------ |
| `tsconfig` files, `typecheck`, emit scripts in `packages/` | Full API reference of every hook (see `packages/core` README) |
| Published `.d.ts` for `@unsetsoft/*`                       | TypeScript config inside user apps beyond pointers            |
| Runtime, CLI, presets, and DevTools source in `.ts`        | CRA templates and generated apps (stay JS / `.ryx`)           |

Runtime bundles shipped to npm remain **JavaScript** (Rollup/Webpack). TypeScript
is used for **static checking**, **editor support**, and **authoring maintainer
source** in monorepo packages.

---

## Two goals

| Goal                        | Audience                                                             | What it means in this repo                                              |
| :-------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **A. Types for consumers**  | Apps using TS, typed `ryunix.config.js`, imports from `@unsetsoft/*` | Hand-written `.d.ts`, `"types"` in `package.json`, JSDoc in public APIs |
| **B. Source in TypeScript** | Monorepo maintainers                                                 | `.ts` files, `tsc` emit where needed, Rollup over emitted JS (core)     |

Both goals are **complete** across the four published packages (`core`, `presets`,
`cra`, `devtools`). Remaining `.js` is intentional (JSX runtime, tests, legacy
`.cjs`, or user-facing templates).

---

## Migration phases (maintainers)

Internal plan (phases 0–7). Status as of 2026-05-24:

| Phase | Name                     | Status | Deliverable                                                                          |
| :---: | :----------------------- | :----- | :----------------------------------------------------------------------------------- |
| **0** | Shared infra             | Done   | `tsconfig.base.json`, per-package `tsconfig.json`, `pnpm run typecheck`, CI          |
| **1** | Presets consumer types   | Done   | `webpack/config.d.ts`, `RyunixUserConfig`, CRA template JSDoc                        |
| **2** | Core consumer types      | Done   | `types/index.d.ts`, JSX runtime `.d.ts`, `"types"` on `@unsetsoft/ryunixjs`          |
| **3** | `checkJs` + JSDoc (core) | Done   | `tsconfig.checkjs.json` over `jsx/**/*.js` (JSX runtime)                             |
| **4** | CRA source TS            | Done   | All of `src/` in `.ts`; `build` emits `.js` under `src/`                             |
| **5** | DevTools source TS       | Done   | All extension scripts in `.ts`; `build` emits `.js`                                  |
| **6** | Presets source TS        | Done   | All of `webpack/**/*.ts`; `build` emits `.js` next to source                         |
| **7** | Core source TS           | Done   | `src/lib/**`, `src/utils/**`, `src/main.ts`; `build:lib-ts` emits `.js` under `src/` |

---

## What remains in JavaScript

| Location                                                                | Reason                                                                   |
| :---------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `packages/core/jsx/**/*.js`                                             | Published JSX runtime; optional check via `typecheck:checkjs`            |
| `packages/core/src/tests/**`                                            | Jest tests in JS                                                         |
| `packages/ryunix-presets/webpack/*.cjs`                                 | Legacy CommonJS config (`config.cjs`, `settingfile.cjs`, `envExist.cjs`) |
| `packages/ryunix-presets/webpack/plugins/remark-github-alerts.test.mjs` | Node test for the remark plugin                                          |
| `packages/cra/templates/**`                                             | Scaffolding for end-user apps                                            |
| Root `eslint.config.mjs`                                                | Workspace ESLint config                                                  |

`.js` files emitted by `tsc` in `core`, `presets`, `cra`, and `devtools` **are
committed**; Node and Webpack consume them directly.

---

## Shared infrastructure (root)

### `tsconfig.base.json`

Base compiler options for all packages:

- `allowJs: true`, `checkJs: false` (strict checking enabled per package or via
  dedicated configs such as `tsconfig.checkjs.json`)
- `noEmit: true` at base level (packages override when emitting JS)
- `strict: false` globally — tightened incrementally, not repo-wide on day one

Each package has its own `tsconfig.json` extending this file.

### Turbo and root scripts

| Item                 | Location                       | Role                                              |
| :------------------- | :----------------------------- | :------------------------------------------------ |
| `typecheck` task     | `turbo.json`                   | Runs `typecheck` in every package that defines it |
| `pnpm run typecheck` | Root `package.json`            | Turbo orchestration                               |
| CI                   | `.github/workflows/eslint.yml` | Runs `npm run typecheck` after ESLint             |

### Dependency

- `typescript` and `@types/node` are **devDependencies at the repo root** (shared
  version for the workspace).

---

## Per-package layout

### `@unsetsoft/ryunixjs` (`packages/core`)

#### Consumer types (goal A)

| File                                                               | Role                                                                  |
| :----------------------------------------------------------------- | :-------------------------------------------------------------------- |
| `types/index.d.ts`                                                 | Main export: hooks, render, SSR, router, components, `export default` |
| `jsx/jsx-runtime.d.ts`                                             | Automatic JSX (`jsx`, `jsxs`, `Fragment`, `JSX` namespace)            |
| `jsx/jsx-dev-runtime.d.ts`                                         | Re-exports dev runtime                                                |
| `types/index.typetest.ts`                                          | Compile-time smoke test (not executed)                                |
| `package.json` → `"types"`, `exports["."].types`, JSX export types | npm resolution                                                        |

See also [packages/core/README.md](../../packages/core/README.md) (TypeScript
section).

#### Maintainer source (goal B)

| File                               | Role                                                   |
| :--------------------------------- | :----------------------------------------------------- |
| `src/lib/**/*.ts`                  | Full runtime (hooks, reconciler, DOM, SSR, …)          |
| `src/utils/**/*.ts`, `src/main.ts` | Utilities and Rollup entry                             |
| `src/types/internal.d.ts`          | Internal fiber/hook/DOM types (not published)          |
| `tsconfig.json`                    | Typecheck: `src/**/*.ts`, `jsx/**/*.js`, `types/`      |
| `tsconfig.emit.json`               | Emits `.js` under `src/` (same folder as `.ts` source) |
| `tsconfig.checkjs.json`            | Optional JSX runtime check (`jsx/**/*.js`)             |
| `rollup.config.js`                 | Bundles from `src/main.js` (emitted) into `dist/`      |

#### Scripts

| Script              | Command                                                      |
| :------------------ | :----------------------------------------------------------- |
| `typecheck`         | `tsc --noEmit -p tsconfig.json`                              |
| `typecheck:checkjs` | `tsc --noEmit -p tsconfig.checkjs.json` (JSX runtime only)   |
| `build:lib-ts`      | `tsc -p tsconfig.emit.json` — regenerates `.js` under `src/` |
| `build`             | Rollup → artifacts in `dist/`                                |
| `prepublishOnly`    | `build:lib-ts` + `build`                                     |

After editing any `.ts` under `src/lib/`, `src/utils/`, or `src/main.ts`, run
`build:lib-ts` before testing Rollup or the local integration app.

---

### `@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)

#### Consumer types (goal A)

| File                                             | Role                                       |
| :----------------------------------------------- | :----------------------------------------- |
| `webpack/config.d.ts`                            | `RyunixUserConfig` and nested config types |
| `webpack/config.typetest.ts`                     | Compile-time smoke test                    |
| `package.json` → `"types"`, `exports["."].types` | npm resolution                             |

Documented in [configuration-loading.md](../ryunix-presets/configuration-loading.md)
and package README.

#### Maintainer source (goal B)

| File                               | Role                                                   |
| :--------------------------------- | :----------------------------------------------------- |
| `webpack/**/*.ts`                  | Webpack config, CLI (`bin/`), loaders, plugins, utils  |
| `webpack/types/presets-shims.d.ts` | Stubs for untyped modules                              |
| `webpack/utils/config.cjs.d.ts`    | Types for legacy CJS config                            |
| `tsconfig.emit.json`               | Emits ESM `.js` under `webpack/` (same path as source) |

Source imports use the **`.js`** extension (ESM resolution to emitted artifacts).
The published binary is `webpack/bin/index.js`.

#### Scripts

| Script           | Command                                               |
| :--------------- | :---------------------------------------------------- |
| `typecheck`      | `tsc --noEmit -p tsconfig.json`                       |
| `build`          | `tsc -p tsconfig.emit.json`                           |
| `test`           | Remark plugin tests (`remark-github-alerts.test.mjs`) |
| `prepublishOnly` | `build`                                               |

---

### `@unsetsoft/cra` (`packages/cra`)

#### Maintainer source (goal B — done)

| Aspect    | Detail                                                                            |
| :-------- | :-------------------------------------------------------------------------------- |
| Source    | `src/**/*.ts` (`cli.ts`, `create-app.ts`, `helpers/*`)                            |
| Emit      | `tsconfig.emit.json` → CommonJS `.js` under `src/` (including `cli.js` for `bin`) |
| Templates | `templates/` stay JS / `.ryx` (generated apps, not the CRA package)               |

#### Scripts

| Script      | Command                         |
| :---------- | :------------------------------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build`     | `tsc -p tsconfig.emit.json`     |

Package docs: [docs/en/cra/package-overview.md](../cra/package-overview.md).
Run `build` after editing any `.ts` under `src/` before testing `node src/cli.js`.

---

### `@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)

#### Maintainer source (goal B — done)

| File                                                                       | Role                                             |
| :------------------------------------------------------------------------- | :----------------------------------------------- |
| `background.ts`, `content-script.ts`, `devtools.ts`, `hook.ts`, `panel.ts` | Extension sources                                |
| Emitted `*.js`                                                             | Referenced by `manifest.json` and extension flow |
| `chrome.d.ts`, `window.d.ts`                                               | Minimal stubs (no `@types/chrome` dependency)    |
| `tsconfig.emit.json`                                                       | Emits all script `.js` at package root           |

#### Scripts

| Script      | Command                         |
| :---------- | :------------------------------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build`     | `tsc -p tsconfig.emit.json`     |

Run `build` before reloading the unpacked extension in Chrome.

---

## Scripts

### From the repository root

```bash
pnpm run typecheck          # all packages (Turbo)
pnpm --filter @unsetsoft/ryunixjs run typecheck:checkjs   # JSX runtime only
pnpm --filter @unsetsoft/cra run build
pnpm --filter @unsetsoft/ryunix-devtools run build
pnpm --filter @unsetsoft/ryunix-presets run build
pnpm --filter @unsetsoft/ryunixjs run build:lib-ts        # after editing runtime .ts
```

### Typical maintainer workflow

```text
1. pnpm install
2. Edit code (.ts in packages; jsx/**/*.js in core when needed)
3. pnpm run typecheck                    ← required before PR
4. If you changed emitted .ts sources:
   - core:     pnpm --filter @unsetsoft/ryunixjs run build:lib-ts
   - cra:      pnpm --filter @unsetsoft/cra run build
   - devtools: pnpm --filter @unsetsoft/ryunix-devtools run build
   - presets:  pnpm --filter @unsetsoft/ryunix-presets run build
5. If you changed packages/core and need dist/ or publish:
   pnpm --filter @unsetsoft/ryunixjs run build
6. pnpm run test && pnpm run lint
```

---

## CI and before a PR

Pull requests should pass:

- `pnpm run lint`
- `pnpm run test`
- **`pnpm run typecheck`**

The ESLint workflow also runs `typecheck`. Fixing type errors locally avoids CI
failures.

When adding **new `.ts` files**:

1. Include them in the package `tsconfig.json` (or an emit config).
2. Add or extend `typecheck` if the package did not compile them before.
3. For runtime `.js` consumed by Node or Webpack without bundling, provide an
   **emit script** (CRA, DevTools, presets pattern) or **emit + Rollup** (core
   pattern).

---

## TypeScript in Ryunix apps (end users)

This monorepo publishes types; **generated apps** opt in separately.

| Need                        | Package / file                                                                                                     |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| Typed `ryunix.config.js`    | `@unsetsoft/ryunix-presets` → `RyunixUserConfig` (JSDoc or TS config)                                              |
| Hooks, components, SSR APIs | `@unsetsoft/ryunixjs` → `types/index.d.ts`                                                                         |
| Automatic JSX               | `"jsxImportSource": "@unsetsoft/ryunixjs"` in app `tsconfig.json` (Ryunix Webpack/SWC presets set this for `.ryx`) |

Example (app `ryunix.config.js`):

```javascript
/** @type {import('@unsetsoft/ryunix-presets').RyunixUserConfig} */
export default {
  ssr: true,
  port: 3000,
}
```

Example (app component):

```typescript
import {
  useStore,
  createElement,
  type RyunixElement,
} from '@unsetsoft/ryunixjs'
```

---

## Related documentation

| Topic                    | Document                                                                     |
| :----------------------- | :--------------------------------------------------------------------------- |
| Root scripts and stack   | [tech-stack-and-scripts.md](./tech-stack-and-scripts.md)                     |
| Presets config types     | [configuration-loading.md](../ryunix-presets/configuration-loading.md)       |
| Core package README      | [packages/core/README.md](../../packages/core/README.md)                     |
| Presets package README   | [packages/ryunix-presets/README.md](../../packages/ryunix-presets/README.md) |
| Contributing / PR checks | [CONTRIBUTING.md](../../CONTRIBUTING.md)                                     |
| Doc index                | [overview.md](../overview.md)                                                |
