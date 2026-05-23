# RyunixJS Internal Documentation

Welcome to the internal documentation for **RyunixJS**. These documents are for maintainers, core contributors, and developers who want to understand how the framework is built.

**You are here:** `docs/en/overview.md` — the English documentation index.

---

## How this folder is organized

All internal docs live under `docs/`, split by language. Each language mirrors the same layout and maps to packages in `packages/`.

```text
docs/
├── en/                              ← English (this folder)
│   ├── overview.md                  ← Index (this file)
│   ├── repository-guide.md          ← Monorepo onboarding (start here if you just cloned)
│   ├── core/                        ← packages/core — runtime engine
│   ├── ryunix-presets/              ← packages/ryunix-presets — CLI & Webpack
│   └── cra/                         ← packages/cra — project scaffolding
└── es/                              ← Spanish (same structure)
    ├── overview.md
    ├── guia-del-repositorio.md      ← Spanish filenames in docs/es/
    ├── resumen.md
    ├── core/                        ← e.g. vdom-y-reconciliacion.md
    ├── ryunix-presets/
    └── cra/
```

| Path (from `docs/en/`) | Package in repo | What you will find |
| :--- | :--- | :--- |
| [`./repository-guide.md`](./repository-guide.md) | *(monorepo root)* | What RyunixJS is, comparison with Next.js, root files, useful commands. **Best entry point after cloning.** |
| [`./core/`](./core/) | `packages/core` | Reconciler, hooks, rendering, SSR, components. |
| [`./ryunix-presets/`](./ryunix-presets/) | `packages/ryunix-presets` | `ryunix` CLI, Webpack, routing, SSG, API routes, loaders. |
| [`./cra/`](./cra/) | `packages/cra` | `create-ryunix-app` CLI and project templates. |

Spanish version of this index: [docs/es/resumen.md](../es/resumen.md) (Spanish filenames under `docs/es/`).

---

## `repository-guide.md` — Monorepo guide

Single document at the root of `docs/en/`. Not tied to one package; it explains the **whole repository** for someone opening the monorepo for the first time.

- [Repository guide](./repository-guide.md)

Spanish equivalent: [Guía del repositorio](../es/guia-del-repositorio.md).

---

## `core/` — `packages/core`

Runtime engine: Virtual DOM, Fiber reconciler, hooks, client/server rendering, and built-in components.

| Document | Topic |
| :--- | :--- |
| [virtual-dom-and-reconciliation.md](./core/virtual-dom-and-reconciliation.md) | `createElement`, work loop, reconciler, DOM commit |
| [hooks.md](./core/hooks.md) | `useStore`, `useEffect`, memoization, SSR hook behavior |
| [rendering.md](./core/rendering.md) | `render`, `hydrate`, `renderToString`, streaming |
| [state-and-priority.md](./core/state-and-priority.md) | Batching, priority queue, `useTransition` |
| [advanced-components.md](./core/advanced-components.md) | `lazy`, `Suspense`, `memo`, portals, `forwardRef` |
| [components.md](./core/components.md) | Built-in components overview |
| [server-features.md](./core/server-features.md) | Server Actions, `ServerBoundary`, `bridge.js` |
| [error-boundary.md](./core/error-boundary.md) | Error boundaries and dev overlay |
| [devtools-and-profiler.md](./core/devtools-and-profiler.md) | Dev warnings and in-memory profiler |

---

## `ryunix-presets/` — `packages/ryunix-presets`

Build tooling: `ryunix` CLI, dual Webpack (client + server), file-based routing, SSG, and API compilation.

| Document | Topic |
| :--- | :--- |
| [cli-and-bootstrapping.md](./ryunix-presets/cli-and-bootstrapping.md) | `ryunix dev`, `build`, `start`, dev & prod servers |
| [configuration-loading.md](./ryunix-presets/configuration-loading.md) | `ryunix.config.js` discovery and normalization |
| [routing-and-ssg.md](./ryunix-presets/routing-and-ssg.md) | `AppRouterPlugin`, SSG, dev SSR handler |
| [api-router.md](./ryunix-presets/api-router.md) | API routes, SWC compile, hot reload |
| [webpack-loaders.md](./ryunix-presets/webpack-loaders.md) | RSC loader, Server Actions loader |
| [file-based-errors.md](./ryunix-presets/file-based-errors.md) | `error.ryx`, global dev overlay |

---

## `cra/` — `packages/cra`

Official scaffolder (`npx @unsetsoft/cra`) and template projects.

| Document | Topic |
| :--- | :--- |
| [cli-and-helpers.md](./cra/cli-and-helpers.md) | Interactive CLI, `create-app.js`, npm version resolution |
| [template-generation.md](./cra/template-generation.md) | `ryunix-base`, `ryunix-tailwind`, copy mechanism |

---

## Suggested reading order

1. [Repository guide](./repository-guide.md) — context for the monorepo and how pieces connect.
2. [core/virtual-dom-and-reconciliation.md](./core/virtual-dom-and-reconciliation.md) — how UI updates work.
3. [ryunix-presets/cli-and-bootstrapping.md](./ryunix-presets/cli-and-bootstrapping.md) — how apps are built and served.
4. Deep-dive into any `core/` or `ryunix-presets/` doc as needed.

---

## Other languages

| Language | Index | Monorepo guide |
| :--- | :--- | :--- |
| English | [docs/en/overview.md](./overview.md) | [repository-guide.md](./repository-guide.md) |
| Español | [docs/es/resumen.md](../es/resumen.md) | [guia-del-repositorio.md](../es/guia-del-repositorio.md) |

Public README: [README.md](../../README.md) · [README.es.md](../../README.es.md).
