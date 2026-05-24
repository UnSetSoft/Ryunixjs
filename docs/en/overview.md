# RyunixJS Internal Documentation

> **Language / Idioma:** [English](./overview.md) · [Español](../es/resumen.md)

Welcome to the internal documentation for **RyunixJS**. These documents are for
maintainers, core contributors, and developers who want to understand how the
framework is built.

**You are here:** `docs/en/overview.md` — the English documentation index.

---

## Table of contents

- [RyunixJS Internal Documentation](#ryunixjs-internal-documentation)
  - [Table of contents](#table-of-contents)
  - [How this folder is organized](#how-this-folder-is-organized)
  - [`guides/` — Monorepo guides](#guides--monorepo-guides)
  - [`core/` — `packages/core`](#core--packagescore)
  - [`ryunix-presets/` — `packages/ryunix-presets`](#ryunix-presets--packagesryunix-presets)
  - [`cra/` — `packages/cra`](#cra--packagescra)
  - [`ryunix-devtools/` — `packages/ryunix-devtools`](#ryunix-devtools--packagesryunix-devtools)
  - [Suggested reading order](#suggested-reading-order)
  - [Other languages](#other-languages)

---

## How this folder is organized

All internal docs live under `docs/`, split by language. Each language mirrors
the same layout and maps to packages in `packages/`.

```text
docs/
├── en/                              ← English (this folder)
│   ├── overview.md                  ← Index (this file)
│   ├── guides/                      ← Monorepo-wide guides (not tied to one package)
│   ├── core/                        ← packages/core — runtime engine
│   ├── ryunix-presets/              ← packages/ryunix-presets — CLI & Webpack
│   ├── cra/                         ← packages/cra — project scaffolding
│   └── ryunix-devtools/             ← packages/ryunix-devtools — Chrome extension
└── es/                              ← Spanish (same structure)
    ├── resumen.md                   ← Index (Spanish)
    ├── guias/                       ← Guías del monorepo (nombres en español)
    ├── core/                        ← e.g. vdom-y-reconciliacion.md
    ├── ryunix-presets/
    ├── cra/
    └── ryunix-devtools/
```

| Path (from `docs/en/`)                   | Package in repo           | What you will find                                                   |
| :--------------------------------------- | :------------------------ | :------------------------------------------------------------------- |
| [`./guides/`](./guides/)                 | _(monorepo root)_         | Onboarding, testing, tech stack and root scripts (see guides below). |
| [`./core/`](./core/)                     | `packages/core`           | Reconciler, hooks, rendering, SSR, components.                       |
| [`./ryunix-presets/`](./ryunix-presets/) | `packages/ryunix-presets` | `ryunix` CLI, Webpack, routing, SSG, API routes, loaders.            |
| [`./cra/`](./cra/)                       | `packages/cra`            | `@unsetsoft/cra` CLI and project templates.                          |
| [`./ryunix-devtools/`](./ryunix-devtools/) | `packages/ryunix-devtools` | Chrome extension for debugging Ryunix apps.                        |

---

## `guides/` — Monorepo guides

Documents under `docs/en/guides/` describe the **whole repository**, not a
single package.

| Document                                                        | Topic                                                                         |
| :-------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| [repository-guide.md](./guides/repository-guide.md)             | What RyunixJS is, repo layout, useful commands. **Start here after cloning.** |
| [automated-testing.md](./guides/automated-testing.md)           | Jest in core, `pnpm test`, `pnpm lint`, manual CRA checks.                    |
| [local-integration-app.md](./guides/local-integration-app.md)   | Ryunix app in `test/webpack` with `workspace:*` and `pnpm run:web`.           |
| [tech-stack-and-scripts.md](./guides/tech-stack-and-scripts.md) | Technologies and root `pnpm` scripts (AI-assisted).                           |
| [typescript-in-the-monorepo.md](./guides/typescript-in-the-monorepo.md) | TypeScript: `tsconfig`, `typecheck`, emit, and source migration status.       |

---

## `core/` — `packages/core`

Runtime engine: Virtual DOM, Fiber reconciler, hooks, client/server rendering,
and built-in components.

| Document                                                                      | Topic                                                   |
| :---------------------------------------------------------------------------- | :------------------------------------------------------ |
| [package-overview.md](./core/package-overview.md)                             | Role, `packages/core/` layout, Rollup build, TS         |
| [virtual-dom-and-reconciliation.md](./core/virtual-dom-and-reconciliation.md) | `createElement`, work loop, reconciler, DOM commit      |
| [hooks.md](./core/hooks.md)                                                   | `useStore`, `useEffect`, memoization, SSR hook behavior |
| [rendering.md](./core/rendering.md)                                           | `render`, `hydrate`, `renderToString`, streaming        |
| [state-and-priority.md](./core/state-and-priority.md)                         | Batching, priority queue, `useTransition`               |
| [advanced-components.md](./core/advanced-components.md)                       | `lazy`, `Suspense`, `memo`, portals, `forwardRef`       |
| [components.md](./core/components.md)                                         | Built-in components overview                            |
| [server-features.md](./core/server-features.md)                               | Server Actions, `ServerBoundary`, `bridge.js`           |
| [error-boundary.md](./core/error-boundary.md)                                 | Error boundaries and dev overlay                        |
| [devtools-and-profiler.md](./core/devtools-and-profiler.md)                   | Dev warnings and in-memory profiler                     |

---

## `ryunix-presets/` — `packages/ryunix-presets`

Build tooling: `ryunix` CLI, dual Webpack (client + server), file-based routing,
SSG, and API compilation.

| Document                                                              | Topic                                              |
| :-------------------------------------------------------------------- | :------------------------------------------------- |
| [package-overview.md](./ryunix-presets/package-overview.md)         | Role, `webpack/`, `ryunix` CLI, `RyunixUserConfig` |
| [cli-and-bootstrapping.md](./ryunix-presets/cli-and-bootstrapping.md) | `ryunix dev`, `build`, `start`, dev & prod servers |
| [configuration-loading.md](./ryunix-presets/configuration-loading.md) | `ryunix.config.js` discovery and normalization     |
| [routing-and-ssg.md](./ryunix-presets/routing-and-ssg.md)             | `AppRouterPlugin`, SSG, dev SSR handler            |
| [api-router.md](./ryunix-presets/api-router.md)                       | API routes, SWC compile, hot reload                |
| [webpack-loaders.md](./ryunix-presets/webpack-loaders.md)             | RSC loader, Server Actions loader                  |
| [file-based-errors.md](./ryunix-presets/file-based-errors.md)         | `error.ryx`, global dev overlay                    |

---

## `cra/` — `packages/cra`

Official scaffolder (`npx @unsetsoft/cra`) and template projects.

| Document                                               | Topic                                                    |
| :----------------------------------------------------- | :------------------------------------------------------- |
| [package-overview.md](./cra/package-overview.md)       | Monorepo role, `packages/cra/` layout, TS → JS flow      |
| [cli-and-helpers.md](./cra/cli-and-helpers.md)         | `cli.ts`, `create-app.ts`, helpers, CLI flags            |
| [template-generation.md](./cra/template-generation.md) | `ryunix-base`, Tailwind/ESLint variants, copy and layout |

---

## `ryunix-devtools/` — `packages/ryunix-devtools`

Browser extension (Manifest V3) to inspect Ryunix apps in Chrome or Edge.

| Document                                                         | Topic                                      |
| :--------------------------------------------------------------- | :----------------------------------------- |
| [package-overview.md](./ryunix-devtools/package-overview.md)   | Layout, scripts, content-script/hook flow  |

---

## Suggested reading order

1. [Repository guide](./guides/repository-guide.md) — context for the monorepo
   and

   how pieces connect.

2. [Automated testing](./guides/automated-testing.md) and
   [local integration app](./guides/local-integration-app.md) — Jest/lint and

   browser validation with `workspace:*`.

3. [core/virtual-dom-and-reconciliation.md](./core/virtual-dom-and-reconciliation.md)

   — how UI updates work.

4. [ryunix-presets/cli-and-bootstrapping.md](./ryunix-presets/cli-and-bootstrapping.md)

   — how apps are built and served.

5. Deep-dive into any `core/` or `ryunix-presets/` doc as needed.

---

## Other languages

| Language | Index                                  | Monorepo guide                                                 |
| :------- | :------------------------------------- | :------------------------------------------------------------- |
| English  | [docs/en/overview.md](./overview.md)   | [repository-guide.md](./guides/repository-guide.md)            |
| Español  | [docs/es/resumen.md](../es/resumen.md) | [guia-del-repositorio.md](../es/guias/guia-del-repositorio.md) |

Public README: [README.md](../../README.md) ·
[README.es.md](../../README.es.md).
