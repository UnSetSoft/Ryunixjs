# RyunixJS Repository Guide

> **Language / Idioma:** [English](./repository-guide.md) ·
> [Español](../../es/guias/guia-del-repositorio.md)

For developers cloning the monorepo for the first time. Covers what the project
is, how it works, how it compares to Next.js, and what each root-level file
means.

---

## Table of contents

- [RyunixJS Repository Guide](#ryunixjs-repository-guide)
  - [Table of contents](#table-of-contents)
  - [What is RyunixJS?](#what-is-ryunixjs)
  - [Monorepo packages](#monorepo-packages)
  - [How it works](#how-it-works)
  - [Root directory (`/`)](#root-directory-)
  - [Related documentation](#related-documentation)
  - [One-line summary](#one-line-summary)

---

## What is RyunixJS?

**RyunixJS** is a **fully standalone** JavaScript UI framework: it does not
bundle React or Preact. It offers a familiar API (components, JSX, hooks) with
its own engine: fiber-based reconciler, concurrent rendering, SSR/SSG, Server
Components, and Server Actions.

Maintained by [UnSetSoft](https://github.com/UnSetSoft) and published on npm
under `@unsetsoft/*`.

### Key features

- **Zero dependencies in the core**: lightweight, independent runtime.
- **React-like API**: `useStore`, `useEffect`, `useContext`, etc.

  (Ryunix-specific names and behavior).

- **Hybrid rendering**: CSR, SSR, and SSG built in.
- **Full-stack**: Server Components, Server Actions, API routes.
- **Native MDX**: rich content in pages.
- **Integrated tooling**: CLI, Webpack presets, production server.
- **DevTools**: browser extension for inspecting components.

---

## Monorepo packages

| Package                      | Path                       | Description                                             |
| :--------------------------- | :------------------------- | :------------------------------------------------------ |
| `@unsetsoft/ryunixjs`        | `packages/core`            | Engine: VDOM, reconciliation, hooks, render, hydration. |
| `@unsetsoft/ryunix-presets`  | `packages/ryunix-presets`  | `ryunix` CLI, dual Webpack config, routing, SSG, API.   |
| `@unsetsoft/cra`             | `packages/cra`             | Scaffolding: `npx @unsetsoft/cra@latest my-app`.        |
| `@unsetsoft/ryunix-devtools` | `packages/ryunix-devtools` | Browser extension for debugging.                        |

---

## How it works

### 1. Core: JSX to DOM

1. JSX is transpiled to `createElement` calls.
2. A virtual tree (fibers) is built.
3. A **work loop** processes fibers in chunks (high priority via microtasks, low

   via `requestIdleCallback`).

4. The **reconciler** diffs children (by `key`) and tags effects: place, update,

   delete, or hydrate.

5. The **commit** phase applies DOM changes synchronously and runs effects.

See [Virtual DOM & Reconciliation](./core/virtual-dom-and-reconciliation.md).

### 2. Presets: build and server

In a generated app, `npm run dev` runs the **`ryunix`** CLI:

| Command        | Role                                               |
| :------------- | :------------------------------------------------- |
| `ryunix dev`   | Dual Webpack (client + server), HMR, dev SSR.      |
| `ryunix build` | Clean artifacts, compile, optional SSG prerender.  |
| `ryunix start` | Production HTTP server (cache, compression, APIs). |

**File-based routing** under `app/`:

- Pages: `app/index.ryx`, `app/about/index.ryx`, …
- Layouts: `app/layout.ryx`
- Errors: `app/errors.ryx`
- APIs: `app/api/.../router.js`

A Webpack plugin scans `app/`, infers server vs client components, and generates
the router with `Suspense`, `ServerBoundary`, and `ErrorBoundary`.

See [CLI & Bootstrapping](./ryunix-presets/cli-and-bootstrapping.md),
[Routing & SSG](./ryunix-presets/routing-and-ssg.md).

### 3. Quick start (new app, outside this repo)

```bash
npx @unsetsoft/cra@latest my-ryunix-app
cd my-ryunix-app
npm run dev
```

### 4. Is it like Next.js?

### Similar in product shape; different implementation

| Concept        | Next.js                      | RyunixJS                                |
| :------------- | :--------------------------- | :-------------------------------------- |
| Folder routing | `app/page.tsx`, `layout.tsx` | `app/index.ryx`, `layout.ryx`           |
| Hybrid render  | CSR, SSR, SSG                | CSR, SSR, SSG                           |
| Full-stack     | API routes, Server Actions   | `app/api/.../router.js`, Server Actions |
| Tooling        | `next dev`, `build`, `start` | `ryunix dev`, `build`, `start`          |

Next runs on **React**. Ryunix has its **own** reconciler and hooks (`useStore`,
not React’s `useState`).

```text
React  → UI engine     →  @unsetsoft/ryunixjs (packages/core)
Next   → React + stack  →  ryunix-presets + CRA + app/
```

---

## Root directory (`/`)

This root is the **framework monorepo**, not an end-user Ryunix app. There is no
`app/index.ryx` here.

| Folder      | Contents                                            |
| :---------- | :-------------------------------------------------- |
| `packages/` | Publishable packages: core, presets, cra, devtools. |
| `docs/`     | Internal documentation (this guide included).       |
| `assets/`   | Repo assets (e.g. README logo).                     |
| `.github/`  | CI, issue/PR templates, Dependabot.                 |
| `.vscode/`  | Optional editor tasks and settings.                 |

`test/` is gitignored: local maintainer test apps (`pnpm run:web`).

### Key root files

| File                  | Role                                        |
| :-------------------- | :------------------------------------------ |
| `package.json`        | Workspace scripts (Turbo, release, lint).   |
| `pnpm-workspace.yaml` | pnpm workspace globs.                       |
| `turbo.json`          | Parallel tasks and cache.                   |
| `kgmono.config.js`    | Version bumps via gmvu-cli.                 |
| `eslint.config.mjs`   | ESLint flat config.                         |
| `CONTRIBUTING.md`     | Contribution guide (branch `canary`, etc.). |

### Local development: the `pnpm dev` equivalent

In a **Ryunix app** (CRA output), day-to-day development is:

```bash
pnpm dev    # → runs `ryunix dev` (Webpack + server + HMR)
```

This repository root is **not an app**; it is the framework monorepo. There is
**no single `pnpm dev` that opens the framework in a browser**.

| Goal                                                  | Command                                   | What you get                                                    |
| :---------------------------------------------------- | :---------------------------------------- | :-------------------------------------------------------------- |
| **See the framework running** (closest to `pnpm dev`) | `pnpm run:web`                            | Browser app using **workspace core + presets**                  |
| Rebuild core after editing `packages/core`            | `pnpm --filter @unsetsoft/ryunixjs build` | No UI; reload or restart `run:web`                              |
| Exercise the create-app CLI                           | `pnpm --filter @unsetsoft/cra dev`        | Terminal wizard (not a website)                                 |
| Root `pnpm dev`                                       | Turbo runs `dev` per package              | Today only **CRA**; **core** and **presets** have no dev server |

Typical maintainer flow: `pnpm install` → create `test/webpack` once →
`pnpm build` → **`pnpm run:web`** → rebuild core or restart dev server when
needed.

See [testing guide](./testing-guide.md) for setup and per-package checks.

### Useful commands

```bash
pnpm install
pnpm run:web    # browser dev (test/webpack app)
pnpm build
pnpm test
pnpm lint
pnpm dev        # Turbo: CRA CLI only today, not a web app
```

---

## Related documentation

| Topic              | Link                                                                                         |
| :----------------- | :------------------------------------------------------------------------------------------- |
| Testing guide      | [testing-guide.md](./testing-guide.md)                                                       |
| Technical overview | [docs/en/overview.md](./overview.md)                                                         |
| Virtual DOM        | [docs/en/core/virtual-dom-and-reconciliation.md](./core/virtual-dom-and-reconciliation.md)   |
| Hooks              | [docs/en/core/hooks.md](./core/hooks.md)                                                     |
| CLI & presets      | [docs/en/ryunix-presets/cli-and-bootstrapping.md](./ryunix-presets/cli-and-bootstrapping.md) |
| Public README      | [README.md](../../README.md)                                                                 |

---

## One-line summary

RyunixJS is a **React-like full-stack framework** with a **standalone core** and
**integrated tooling** (CLI, dual Webpack, file-based routes, SSR/SSG). This
repository root is the **maintainer monorepo**, not a user-facing application.
