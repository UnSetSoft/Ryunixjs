<!-- markdownlint-disable MD060 -->

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
  - [`ryunix-vscode/` — `packages/ryunix-vscode`](#ryunix-vscode--packagesryunix-vscode)
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
│   ├── ryunix-devtools/             ← packages/ryunix-devtools — Chrome extension
│   └── ryunix-vscode/               ← packages/ryunix-vscode — VS Code extension
└── es/                              ← Spanish (same structure)
    ├── resumen.md                   ← Index (Spanish)
    ├── guias/                       ← Guías del monorepo (nombres en español)
    ├── core/                        ← e.g. vdom-y-reconciliacion.md
    ├── ryunix-presets/
    └── cra/
```

| Path (from `docs/en/`)                     | Package in repo            | What you will find                                                   |
| :----------------------------------------- | :------------------------- | :------------------------------------------------------------------- |
| [`./guides/`](./guides/)                   | _(monorepo root)_          | Onboarding, testing, tech stack and root scripts (see guides below). |
| [`./core/`](./core/)                       | `packages/core`            | Reconciler, hooks, rendering, SSR, components.                       |
| [`./ryunix-presets/`](./ryunix-presets/)   | `packages/ryunix-presets`  | `ryunix` CLI, Webpack, routing, SSG, API routes, loaders.            |
| [`./cra/`](./cra/)                         | `packages/cra`             | `create-ryunix-app` CLI and project templates.                       |
| [`./ryunix-devtools/`](./ryunix-devtools/) | `packages/ryunix-devtools` | Chrome extension for runtime component inspection.                   |
| [`./ryunix-vscode/`](./ryunix-vscode/)     | `packages/ryunix-vscode`   | VS Code extension for `.ryx` syntax highlighting and snippets.       |

Each package folder includes a **package overview** (`package-overview.md` in
English, `resumen-paquete.md` in Spanish): folder layout, how the package works,
cross-package relationships, and links to deep-dive docs. Start there when
exploring a single package.

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

---

## `core/` — `packages/core`

Runtime engine: Virtual DOM, Fiber reconciler, hooks, client/server rendering,
and built-in components.

| Document                                                                      | Topic                                                   |
| :---------------------------------------------------------------------------- | :------------------------------------------------------ |
| [package-overview.md](./core/package-overview.md)                             | **Package entry** — layout, modules, render flow        |
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
| [package-overview.md](./ryunix-presets/package-overview.md)           | **Package entry** — CLI, plugins, app conventions       |
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
| [package-overview.md](./cra/package-overview.md)       | **Package entry** — templates, flags, create-app        |
| [cli-and-helpers.md](./cra/cli-and-helpers.md)         | Interactive CLI, `create-app.js`, npm version resolution |
| [template-generation.md](./cra/template-generation.md) | `ryunix-base`, `ryunix-tailwind`, copy mechanism         |

---

## `ryunix-devtools/` — `packages/ryunix-devtools`

Chrome extension for inspecting component trees, props, and hooks in running
Ryunix apps.

| Document                                                     | Topic                                  |
| :----------------------------------------------------------- | :------------------------------------- |
| [package-overview.md](./ryunix-devtools/package-overview.md) | **Package entry** — MV3, hook, DevTools panel           |

---

## `ryunix-vscode/` — `packages/ryunix-vscode`

Visual Studio Marketplace extension (`unsetsoft.ryunixjs`) for `.ryx` syntax
highlighting and snippets.

| Document                                                   | Topic                                          |
| :--------------------------------------------------------- | :--------------------------------------------- |
| [package-overview.md](./ryunix-vscode/package-overview.md) | **Package entry** — TypeScript, grammar, F5, vsix       |

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
