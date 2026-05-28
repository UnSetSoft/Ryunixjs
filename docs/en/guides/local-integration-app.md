# Local integration app

> **Language / Idioma:** [English](./local-integration-app.md) ·
> [Español](../../es/guias/app-de-integracion-local.md)

Guide to run the **Ryunix documentation site** against `packages/*` via the
pnpm workspace so framework changes show up in the browser.

This does not replace Jest or `pnpm lint` — see
[automated-testing.md](./automated-testing.md).

| Path                            | Guide                                          |
| :------------------------------ | :--------------------------------------------- |
| Automated tests                 | [automated-testing.md](./automated-testing.md) |
| Integration app (this document) | `../ryunix-doc` + `pnpm run dev:doc`           |

---

## Table of contents

- [Key concepts](#key-concepts)
- [First-time setup](#first-time-setup)
- [Daily workflow](#daily-workflow)
- [Commands from the monorepo root](#commands-from-the-monorepo-root)
- [What to do per package you change](#what-to-do-per-package-you-change)
- [CI smoke vs local docs app](#ci-smoke-vs-local-docs-app)
- [Optional scratch apps under test/](#optional-scratch-apps-under-test)
- [Git and commits](#git-and-commits)
- [Related documentation](#related-documentation)

---

## Key concepts

| Term                            | What it is                                                               |
| :------------------------------ | :----------------------------------------------------------------------- |
| **Monorepo (`Ryunixjs/`)**      | Framework packages (`packages/core`, `packages/ryunix-presets`, …).      |
| **`ryunix-doc` (sibling repo)** | Canonical docs site. Listed in `pnpm-workspace.yaml` as `../ryunix-doc`. |
| **Integration app**             | That docs site with `workspace:*` on `@unsetsoft/ryunixjs` and presets.  |
| **`workspace:*`**               | pnpm links `packages/*` instead of npm registry versions.                |
| **`pnpm run dev:doc`**          | Builds core, then `ryunix dev` in `ryunix-doc`.                          |
| **Root `pnpm dev`**             | Turbo tasks (CRA, etc.). Use `dev:doc` for the browser.                  |

```text
ryx/                         ← typical parent folder (not a git repo)
├── Ryunixjs/                ← framework monorepo
│   ├── packages/core/
│   └── packages/ryunix-presets/
└── ryunix-doc/              ← docs app (workspace member)
         │
         │  workspace:*  →  packages/
         │
         └── pnpm run dev:doc  →  http://localhost:…
```

There is **no** maintained copy under `test/webpack`, `test/webpack1`, or
`test/webpack2`. Those paths are `.gitignore`d; anything you create there is
local scratch only and is not part of the monorepo.

---

## First-time setup

### 0. Requirements

- Node.js 20, 22, 24, or 26 and pnpm 10+ (see `CONTRIBUTING.md`).
- Shell at `Ryunixjs/` and `ryunix-doc` cloned as siblings (see layout above).

### 1. Install and link

```bash
cd Ryunixjs
pnpm run setup:web
```

Runs `pnpm install`, builds `@unsetsoft/ryunixjs`, and checks
`../ryunix-doc/node_modules/@unsetsoft/ryunixjs` points at `packages/core`.

### 2. Start the dev server

```bash
pnpm run dev:doc
```

Open the URL from the terminal (e.g. `http://localhost:3000`).

---

## Daily workflow

1. **`pnpm run dev:doc`** — leave running.
2. Edit by scope:

| You edit…                     | After saving                                                |
| :---------------------------- | :---------------------------------------------------------- |
| `ryunix-doc/src/**`           | HMR reloads.                                                |
| `packages/core/src/**`        | `pnpm --filter @unsetsoft/ryunixjs build`, refresh browser. |
| `packages/ryunix-presets/**`  | Restart `pnpm run dev:doc`.                                 |
| `packages/ryunix-devtools/**` | Reload extension at `chrome://extensions/`.                 |

Before a PR: `pnpm test`, `pnpm lint` ([automated-testing.md](./automated-testing.md)).

---

## Commands from the monorepo root

| Command                  | What it does                             |
| :----------------------- | :--------------------------------------- |
| `pnpm run setup:web`     | Verify `../ryunix-doc` + workspace links |
| `pnpm run dev:doc`       | `ryunix dev` on the docs site            |
| `pnpm run build:doc`     | Production build of the docs site        |
| `pnpm run run:web`       | Alias of `dev:doc` (legacy name)         |
| `pnpm run run:web:build` | Alias of `build:doc`                     |
| `pnpm run run:web:start` | `ryunix start` in `ryunix-doc`           |

If a command fails with «no projects matched», `../ryunix-doc` is missing or not
listed in `pnpm-workspace.yaml`.

---

## What to do per package you change

### `@unsetsoft/ryunix-presets`

1. Build core if needed: `pnpm run build:core`.
2. `pnpm run dev:doc`.
3. Check routing (`src/app/[locale]/`), `pnpm run build:doc`, SSR/hydration.

Docs: [CLI and bootstrapping](../ryunix-presets/cli-and-bootstrapping.md),
[Routing and SSG](../ryunix-presets/routing-and-ssg.md).

### `@unsetsoft/ryunix-devtools`

1. `pnpm run dev:doc`.
2. Chrome → Load unpacked → `packages/ryunix-devtools`.

---

## CI smoke vs local docs app

|         | Local integration          | CI (`scripts/ci-smoke-build.mjs`)           |
| :------ | :------------------------- | :------------------------------------------ |
| App     | `../ryunix-doc`            | `_ci/smoke-app` from `ryunix-base` template |
| Purpose | Docs + `[locale]` routes   | Minimal CRA scaffold build                  |
| In git  | `ryunix-doc` separate repo | `_ci/` gitignored; generated in CI          |

---

## Optional scratch apps under test/

You may copy `ryunix-base` into `test/my-app/` for experiments. That folder is
**gitignored** and **not** in `pnpm-workspace.yaml` unless you add it yourself.
Do not commit configs or sync scripts for those copies — edit `ryunix-doc` for
the shared docs site.

---

## Git and commits

| Scope                                   | Commits                     |
| :-------------------------------------- | :-------------------------- |
| `Ryunixjs/packages/*`, `Ryunixjs/docs/` | Yes → PR to `canary`        |
| `ryunix-doc/`                           | Yes → its own repo / deploy |
| `test/webpack*` (any name)              | Never — `.gitignore`        |

---

## Related documentation

| Topic            | Link                                           |
| :--------------- | :--------------------------------------------- |
| Automated tests  | [automated-testing.md](./automated-testing.md) |
| Repository guide | [repository-guide.md](./repository-guide.md)   |
| Docs index       | [overview.md](../overview.md)                  |
