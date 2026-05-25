# Local integration app

> **Language / Idioma:** [English](./local-integration-app.md) ·
> [Español](../../es/guias/app-de-integracion-local.md)

Guide to set up and use a **test Ryunix application** inside the monorepo so
changes in `packages/*` show up in the browser like they would in a real app
built with the framework.

This does not replace Jest or `pnpm lint` — see
[automated-testing.md](./automated-testing.md).

| Path                            | Guide                                          |
| :------------------------------ | :--------------------------------------------- |
| Automated tests                 | [automated-testing.md](./automated-testing.md) |
| Integration app (this document) | `test/webpack` + `pnpm run:web`                |

---

## Table of contents

- [Local integration app](#local-integration-app)
  - [Table of contents](#table-of-contents)
  - [Key concepts](#key-concepts)
  - [Step by step: first-time setup](#step-by-step-first-time-setup)
  - [Step by step: daily workflow](#step-by-step-daily-workflow)
  - [Commands from the monorepo root](#commands-from-the-monorepo-root)
  - [What to do per package you change](#what-to-do-per-package-you-change)
  - [Create the app with CRA (alternative)](#create-the-app-with-cra-alternative)
  - [App structure](#app-structure)
  - [Git and commits](#git-and-commits)
  - [Related documentation](#related-documentation)

---

## Key concepts

Before running commands, these terms are worth separating:

| Term                            | What it is                                                                                                                                           |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo (root `Ryunixjs/`)** | The **framework** repo: `packages/core`, `packages/ryunix-presets`, etc. It is not a web app; there is no `app/index.ryx` at the root.               |
| **Integration app**             | A **normal Ryunix app** (`app/*.ryx`, `ryunix.config.js`) living under `test/webpack/`. It mirrors what `npx @unsetsoft/cra` generates.              |
| **`test/webpack`**              | **Recommended** path for that app. It is in `.gitignore`: not pushed to git; each developer creates it locally.                                      |
| **`workspace:*`**               | In the app `package.json`, tells pnpm: «use the package from `packages/` in this repo», not the version on npmjs.com.                                |
| **Symlink**                     | After `pnpm install`, `test/webpack/node_modules/@unsetsoft/ryunixjs` points at `packages/core/`. The browser loads the code edited in the monorepo. |
| **`pnpm run:web`**              | **Root** script that runs `ryunix dev` inside `test/webpack` (dev server + HMR).                                                                     |
| **Root `pnpm dev`**             | Does **not** start the integration app. Today it runs Turbo tasks (e.g. CRA CLI). Use `pnpm run:web` for the browser.                                |

```text
Ryunixjs/                    ← monorepo (framework)
├── packages/core/           ← UI engine (@unsetsoft/ryunixjs)
├── packages/ryunix-presets/ ← ryunix CLI + Webpack
└── test/webpack/            ← integration app (gitignored)
         │
         │  workspace:*  →  links to packages/, not npm
         │
         └── pnpm run:web  →  ryunix dev  →  http://localhost:…
```

### What this app is for

| Goal                        | Example                                           |
| :-------------------------- | :------------------------------------------------ |
| See `packages/core` changes | Page with `useStore`, hydration                   |
| Exercise `ryunix-presets`   | `ryunix dev`, routes under `app/`, `ryunix build` |
| Try DevTools                | Chrome extension + Ryunix tab in F12              |
| Sanity-check CRA templates  | Same layout as `ryunix-base`                      |

---

## Step by step: first-time setup

Full sequence from a fresh clone to the app in the browser. Do this **once**
per machine (or after deleting `test/webpack`).

### 0. Requirements

- Node.js 20, 22, or 24 and pnpm 10+ (see `CONTRIBUTING.md`).
- Shell at the monorepo **root** (`Ryunixjs/`).

### 1. Install monorepo dependencies

```bash
pnpm install
```

Installs `packages/*` and registers the workspace. The app under `test/webpack`
does **not** exist yet.

### 2. Create the app folder (copy template)

The official template is at `packages/cra/templates/ryunix-base/`. Copy it to
`test/webpack`:

```bash
mkdir -p test
cp -r packages/cra/templates/ryunix-base test/webpack
cp packages/cra/templates/ryunix-base/gitignore test/webpack/.gitignore
```

Confirm files such as `test/webpack/app/index.ryx` and
`test/webpack/ryunix.config.js` exist.

### 3. Set `package.json` with `workspace:*`

The copied template does **not** include framework dependencies; add them.
Edit `test/webpack/package.json` to look like this (project name is arbitrary):

```json
{
  "name": "ryunix-integration-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ryunix dev",
    "start": "ryunix start",
    "build": "ryunix build"
  },
  "dependencies": {
    "@unsetsoft/ryunixjs": "workspace:*"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "workspace:*"
  },
  "engines": {
    "node": "^20 || ^22 || ^24"
  }
}
```

| Field                                        | Meaning                                                           |
| :------------------------------------------- | :---------------------------------------------------------------- |
| `"@unsetsoft/ryunixjs": "workspace:*"`       | Runtime from `packages/core`.                                     |
| `"@unsetsoft/ryunix-presets": "workspace:*"` | Tooling: `ryunix` CLI and Webpack from `packages/ryunix-presets`. |
| `dev` / `build` / `start` scripts            | Same as in a CRA-generated app.                                   |

Root `pnpm-workspace.yaml` already lists `test/*`, so pnpm treats
`test/webpack` as a workspace package.

### 4. Install again (from the root)

```bash
pnpm install
```

pnpm creates `test/webpack/node_modules/` and links `@unsetsoft/*` to
`packages/`.

### 5. Verify the link is local

```bash
ls -la test/webpack/node_modules/@unsetsoft/ryunixjs
```

Expected: arrow or path to `../../../packages/core` (symlink). If it is a plain
copy with no link, recheck step 3 and repeat step 4.

### 6. Build framework packages

```bash
pnpm build
```

Builds `packages/core` and other packages that define `build`. The dev app
consumes the core build output.

### 7. Start the dev server

```bash
pnpm run:web
```

Same as `pnpm --filter ./test/webpack run dev` → `ryunix dev`. The terminal
prints a URL (e.g. `http://localhost:3000`). Open it in the browser: the
`ryunix-base` welcome page should appear.

### First-time flow (diagram)

```text
pnpm install          → monorepo ready
     ↓
copy ryunix-base → test/webpack
     ↓
edit package.json (workspace:*)
     ↓
pnpm install          → symlinks in test/webpack/node_modules
     ↓
ls -la …/ryunixjs     → verify symlink
     ↓
pnpm build            → build packages/*
     ↓
pnpm run:web          → browser
```

---

## Step by step: daily workflow

When `test/webpack` **already exists**, the routine is shorter:

1. **Open a terminal at the monorepo root.**
2. Run **`pnpm run:web`** — leave it running (dev server).
3. **Edit code** depending on scope:

| You edit…                     | After saving                                                                                       |
| :---------------------------- | :------------------------------------------------------------------------------------------------- |
| `test/webpack/app/**/*.ryx`   | Nothing extra: HMR reloads the page.                                                               |
| `packages/core/src/**`        | In another terminal: `pnpm --filter @unsetsoft/ryunixjs build`, then **refresh** the browser (F5). |
| `packages/ryunix-presets/**`  | Stop `pnpm run:web` (Ctrl+C) and start it again.                                                   |
| `packages/ryunix-devtools/**` | Reload the extension at `chrome://extensions/`.                                                    |

- **Before a PR** touching core: also run
  [automated-testing.md](./automated-testing.md) (`pnpm test`, `pnpm lint`).
- **Commits**: only `packages/*` and `docs/`; `test/webpack` is not in git.

---

## Commands from the monorepo root

| Command              | What it does                   | When to use                      |
| :------------------- | :----------------------------- | :------------------------------- |
| `pnpm run:web`       | `ryunix dev` on `test/webpack` | Daily browser development        |
| `pnpm run:web:build` | `ryunix build` on the app      | Test SSG / production bundles    |
| `pnpm run:web:start` | `ryunix start`                 | Serve a production build locally |

**Requirement:** `test/webpack/package.json` exists (first-time steps above).

If `pnpm run:web` fails with «no projects matched», the app was not created or
the path is not `test/webpack`.

---

## What to do per package you change

### `@unsetsoft/ryunix-presets` (Webpack, CLI, routing)

1. `pnpm --filter @unsetsoft/ryunixjs build` (if core changed).
2. `pnpm run:web`.
3. Check in the app:

| Area            | Check                                                     |
| :-------------- | :-------------------------------------------------------- |
| Routing         | Routes under `app/`, `layout.ryx`, `errors.ryx`           |
| Build           | `pnpm run:web:build` succeeds; `.ryunix/` output          |
| SSR / hydration | No hydration errors in the console                        |
| API             | `app/api/**/router.js` in dev and after `build` + `start` |

Docs: [CLI and bootstrapping](../ryunix-presets/cli-and-bootstrapping.md),
[Routing and SSG](../ryunix-presets/routing-and-ssg.md).

### `@unsetsoft/ryunix-devtools`

1. App running: `pnpm run:web`.
2. Chrome → `chrome://extensions/` → **Developer mode** → **Load unpacked** →
   folder `packages/ryunix-devtools`.
3. F12 → **Ryunix** tab → component tree and props.

Detail: `packages/ryunix-devtools/README.md`.

### Quick summary

| Change in…               | In the integration app                     |
| :----------------------- | :----------------------------------------- |
| Core (hooks, reconciler) | `pnpm test` → build core → refresh browser |
| Presets (Webpack, CLI)   | Restart `pnpm run:web` + checklist above   |
| DevTools                 | Running app + extension reloaded           |

---

## Create the app with CRA (alternative)

Instead of copying the template (first-time steps 2–3), run the generator; then
**replace** npm versions with `workspace:*`.

```bash
mkdir -p test
node packages/cra/src/cli.js test/webpack-app --latest
mv test/webpack-app test/webpack   # if the CLI used another folder name
```

Edit `test/webpack/package.json`: change `@unsetsoft/ryunixjs` and
`@unsetsoft/ryunix-presets` from `^x.y.z` to `workspace:*`. Continue from
**step 4** of [Step by step: first-time setup](#step-by-step-first-time-setup).

### `test/webpack` vs another folder?

|                          | `test/webpack` (recommended) | Folder outside `test/`              |
| :----------------------- | :--------------------------- | :---------------------------------- |
| `pnpm run:web` from root | Yes                          | No (only `pnpm dev` inside the app) |
| Automatic `workspace:*`  | Yes                          | Manual setup                        |
| Git                      | Ignored with rest of `test/` | Depends on location                 |

---

## App structure

```text
test/webpack/
├── app/
│   ├── index.ryx          ← route /
│   ├── layout.ryx         ← global layout
│   ├── errors.ryx         ← error page
│   └── api/hello/router.js
├── styles/global.css
├── ryunix.config.js
└── package.json           ← workspace:* required
```

Each folder under `app/` defines a route; components used on one route only can
live next to that route.

---

## Git and commits

| Scope                 | In `git status`?  | Action                    |
| :-------------------- | :---------------- | :------------------------ |
| `packages/*`, `docs/` | Yes               | Commit and PR to `canary` |
| `test/webpack/**`     | No (`.gitignore`) | Local dev only            |

The integration app is a **personal dev tool**, not part of the published
framework code.

---

## Related documentation

| Topic                  | Link                                                     |
| :--------------------- | :------------------------------------------------------- |
| Automated tests        | [automated-testing.md](./automated-testing.md)           |
| Repository guide       | [repository-guide.md](./repository-guide.md)             |
| Tech stack and scripts | [tech-stack-and-scripts.md](./tech-stack-and-scripts.md) |
| Docs index             | [overview.md](../overview.md)                            |
