# TypeScript in the RyunixJS monorepo

> **Language / Idioma:** [English](./typescript-in-the-monorepo.md) ·
> [Español](../../es/guias/typescript-en-el-monorepo.md)

Reference for **how TypeScript is set up in this repository**: shared config,
scripts, published types for npm consumers, and the incremental migration of
maintainer source code. It complements package READMEs and
[tech-stack-and-scripts.md](./tech-stack-and-scripts.md).

**Last reviewed:** 2026-05-24

---

## Table of contents

- [TypeScript in the RyunixJS monorepo](#typescript-in-the-ryunixjs-monorepo)
  - [Table of contents](#table-of-contents)
  - [Scope](#scope)
  - [Two goals](#two-goals)
  - [Migration phases (maintainers)](#migration-phases-maintainers)
  - [Shared infrastructure (root)](#shared-infrastructure-root)
  - [Per-package layout](#per-package-layout)
  - [Scripts](#scripts)
  - [CI and before a PR](#ci-and-before-a-pr)
  - [TypeScript in Ryunix apps (end users)](#typescript-in-ryunix-apps-end-users)
  - [Related documentation](#related-documentation)

---

## Scope

| In scope | Out of scope |
| :------- | :----------- |
| `tsconfig` files, `typecheck`, emit scripts in `packages/` | Rewriting the entire core in `.ts` (ongoing, phased) |
| Published `.d.ts` for `@unsetsoft/*` | Full API reference of every hook (see `packages/core` README) |
| `checkJs` + JSDoc in `packages/core` | TypeScript config inside user apps beyond pointers |

Runtime bundles shipped to npm remain **JavaScript** (Rollup/Webpack). TypeScript
is used for **static checking**, **editor support**, and **gradual source
migration**.

---

## Two goals

| Goal | Audience | What it means in this repo |
| :--- | :------- | :------------------------- |
| **A. Types for consumers** | Apps using TS, typed `ryunix.config.js`, imports from `@unsetsoft/*` | Hand-written `.d.ts`, `"types"` in `package.json`, JSDoc in public APIs |
| **B. Source in TypeScript** | Monorepo maintainers | `.ts` files, `tsc` emit where needed, Rollup TS plugin for core modules |

Goal **A** is largely done for presets and core. Goal **B** is **incremental**
(one module or folder at a time).

---

## Migration phases (maintainers)

Internal plan (phases 0–7). Status as of 2026-05:

| Phase | Name | Status | Deliverable |
| :---: | :--- | :----- | :------------ |
| **0** | Shared infra | Done | `tsconfig.base.json`, per-package `tsconfig.json`, `pnpm run typecheck`, CI |
| **1** | Presets consumer types | Done | `webpack/config.d.ts`, `RyunixUserConfig`, CRA template JSDoc |
| **2** | Core consumer types | Done | `types/index.d.ts`, JSX runtime `.d.ts`, `"types"` on `@unsetsoft/ryunixjs` |
| **3** | `checkJs` + JSDoc (core) | Done (1st pass) | `tsconfig.checkjs.json` over `src/utils/**` + `src/lib/**`, `internal.d.ts` |
| **4** | CRA source TS | Started | `get-pkg-manager.ts` + `build:helpers` |
| **5** | DevTools source TS | Started | `background.ts` + `build:background` |
| **6** | Presets source TS | Started | `remark-github-alerts.ts` + `build:plugins` |
| **7** | Core source TS | Started | `batching.ts` via `@rollup/plugin-typescript` in Rollup |

**Order for more `.ts` in core:** utilities and public API → hooks → components →
reconciler / work loop (highest risk last).

---

## Shared infrastructure (root)

### `tsconfig.base.json`

Base compiler options for all packages:

- `allowJs: true`, `checkJs: false` (strict checking enabled per package or via
  `tsconfig.checkjs.json`)
- `noEmit: true` at base level (packages override when emitting JS)
- `strict: false` globally — tightened incrementally, not repo-wide on day one

Each package has its own `tsconfig.json` extending this file.

### Turbo and root scripts

| Item | Location | Role |
| :--- | :------- | :--- |
| `typecheck` task | `turbo.json` | Runs `typecheck` in every package that defines it |
| `pnpm run typecheck` | Root `package.json` | Turbo orchestration |
| CI | `.github/workflows/eslint.yml` | Runs `npm run typecheck` after ESLint |

### Dependency

- `typescript` and `@types/node` are **devDependencies at the repo root** (shared
  version for the workspace).

---

## Per-package layout

### `@unsetsoft/ryunixjs` (`packages/core`)

**Consumer types (goal A)**

| File | Role |
| :--- | :--- |
| `types/index.d.ts` | Main export: hooks, render, SSR, router, components, `export default` |
| `jsx/jsx-runtime.d.ts` | Automatic JSX (`jsx`, `jsxs`, `Fragment`, `JSX` namespace) |
| `jsx/jsx-dev-runtime.d.ts` | Re-exports dev runtime |
| `types/index.typetest.ts` | Compile-time smoke test (not executed) |
| `package.json` → `"types"`, `exports["."].types`, JSX export types | npm resolution |

See also [packages/core/README.md](../../packages/core/README.md) (TypeScript
section).

**Maintainer checking (goal B)**

| File | Role |
| :--- | :--- |
| `tsconfig.json` | Includes `src/**/*.js`, `src/**/*.ts`, `jsx/`, `types/` |
| `tsconfig.checkjs.json` | `checkJs: true`, `noImplicitAny: true` on `src/utils/**` and `src/lib/**` |
| `src/types/internal.d.ts` | Internal fiber/hook/DOM types (not published) |
| `src/lib/batching.ts` | First runtime module in TypeScript |
| `rollup.config.js` | `@rollup/plugin-typescript` transpiles `src/**/*.ts` into bundles |

**Scripts**

| Script | Command |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` **and** `tsconfig.checkjs.json` |
| `typecheck:checkjs` | JSDoc/`checkJs` pass only |
| `build` | Rollup (JS + TS sources) |

**Build note:** Most of `packages/core` is still `.js`. Rollup resolves
`import './batching.js'` to `batching.ts` via the TS plugin and `.ts` in resolve
extensions.

---

### `@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)

**Consumer types (goal A)**

| File | Role |
| :--- | :--- |
| `webpack/config.d.ts` | `RyunixUserConfig` and nested config types |
| `webpack/config.typetest.ts` | Compile-time smoke test |
| `package.json` → `"types"`, `exports["."].types` | npm resolution |

Documented in [configuration-loading.md](../ryunix-presets/configuration-loading.md)
and package README.

**Maintainer source (goal B)**

| File | Role |
| :--- | :--- |
| `webpack/plugins/remark-github-alerts.ts` | Source for MDX GitHub alerts plugin |
| `webpack/plugins/remark-github-alerts.js` | Emitted ESM (committed; regenerate with `build:plugins`) |
| `tsconfig.plugins.json` | Emit config for the plugin |

**Scripts**

| Script | Command |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` (includes `webpack/**/*.ts`, `.d.ts`, `.js`, `.mjs`) |
| `build:plugins` | `tsc -p tsconfig.plugins.json` |
| `test` | Node test runner for remark plugin |

Webpack imports `./plugins/remark-github-alerts.js` (not `.mjs`).

---

### `@unsetsoft/cra` (`packages/cra`)

**Maintainer source (goal B — started)**

| File | Role |
| :--- | :--- |
| `src/helpers/get-pkg-manager.ts` | Typed helper for detecting npm/yarn/pnpm/bun |
| `src/helpers/get-pkg-manager.js` | CommonJS emit for `require()` from `create-app.js` |
| `tsconfig.emit.json` | Emits helper JS into `src/helpers/` |

Most of CRA remains `.js` (Commander CLI, templates are unchanged).

**Scripts**

| Script | Command |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` (includes `src/**/*.ts`) |
| `build:helpers` | `tsc -p tsconfig.emit.json` |

Run `build:helpers` after editing `get-pkg-manager.ts` so Node loads fresh JS.

---

### `@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)

**Maintainer source (goal B — started)**

| File | Role |
| :--- | :--- |
| `background.ts` | Service worker source |
| `background.js` | Emitted script referenced by `manifest.json` |
| `chrome.d.ts` | Minimal Chrome extension API stubs (no `@types/chrome` dep) |
| `tsconfig.emit.json` | Emits `background.js` |

Other extension scripts (`panel.js`, `hook.js`, …) are still JavaScript.

**Scripts**

| Script | Command |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build:background` | `tsc -p tsconfig.emit.json` |

Run `build:background` before loading the unpacked extension after editing
`background.ts`.

---

## Scripts

### From the repository root

```bash
pnpm run typecheck          # all packages (Turbo)
pnpm --filter @unsetsoft/ryunixjs run typecheck:checkjs   # core JSDoc only
pnpm --filter @unsetsoft/cra run build:helpers            # after editing get-pkg-manager.ts
pnpm --filter @unsetsoft/ryunix-devtools run build:background
pnpm --filter @unsetsoft/ryunix-presets run build:plugins
```

### Typical maintainer workflow

```text
1. pnpm install
2. Edit code (JS with JSDoc and/or .ts)
3. pnpm run typecheck                    ← required before PR
4. If you changed emitted .ts sources:
   - cra:      pnpm --filter @unsetsoft/cra run build:helpers
   - devtools: pnpm --filter @unsetsoft/ryunix-devtools run build:background
   - presets:  pnpm --filter @unsetsoft/ryunix-presets run build:plugins
5. If you changed packages/core (especially .ts or public API):
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
   **emit script** (CRA, DevTools, presets plugin pattern) or wire **Rollup**
   (core pattern).

---

## TypeScript in Ryunix apps (end users)

This monorepo publishes types; **generated apps** opt in separately.

| Need | Package / file |
| :--- | :------------- |
| Typed `ryunix.config.js` | `@unsetsoft/ryunix-presets` → `RyunixUserConfig` (JSDoc or TS config) |
| Hooks, components, SSR APIs | `@unsetsoft/ryunixjs` → `types/index.d.ts` |
| Automatic JSX | `"jsxImportSource": "@unsetsoft/ryunixjs"` in app `tsconfig.json` (Ryunix Webpack/SWC presets set this for `.ryx`) |

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
import { useStore, createElement, type RyunixElement } from '@unsetsoft/ryunixjs'
```

---

## Related documentation

| Topic | Document |
| :---- | :------- |
| Root scripts and stack | [tech-stack-and-scripts.md](./tech-stack-and-scripts.md) |
| Presets config types | [configuration-loading.md](../ryunix-presets/configuration-loading.md) |
| Core package README | [packages/core/README.md](../../packages/core/README.md) |
| Presets package README | [packages/ryunix-presets/README.md](../../packages/ryunix-presets/README.md) |
| Contributing / PR checks | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| Doc index | [overview.md](../overview.md) |
