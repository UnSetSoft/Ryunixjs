# RyunixJS monorepo testing guide

> **Language / Idioma:** [English](./testing-guide.md) ·
> [Español](../../es/guias/guia-de-pruebas.md)

For **maintainers and contributors** who need to verify framework changes:
automated tests, manual checks per package, and the local integration app.

> **Just want the framework in a browser (like `pnpm dev` in an app)?** Do not
> rely on root `pnpm dev`. Use **`pnpm run:web`** with a `test/webpack` app. See
> [Local development in the repository guide](./repository-guide.md#local-development-the-pnpm-dev-equivalent).

---

## Table of contents

- [RyunixJS monorepo testing guide](#ryunixjs-monorepo-testing-guide)
  - [Table of contents](#table-of-contents)
  - [Quick reference](#quick-reference)
  - [Local development without npm: linked dependencies](#local-development-without-npm-linked-dependencies)
  - [Requirements](#requirements)
  - [Typical maintainer workflow](#typical-maintainer-workflow)
  - [Global commands (from repository root)](#global-commands-from-repository-root)
  - [`@unsetsoft/ryunixjs` (`packages/core`)](#unsetsoftryunixjs-packagescore)
  - [`@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)](#unsetsoftryunix-presets-packagesryunix-presets)
  - [`@unsetsoft/cra` (`packages/cra`)](#unsetsoftcra-packagescra)
  - [`@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)](#unsetsoftryunix-devtools-packagesryunix-devtools)
  - [Local integration app (`test/webpack`)](#local-integration-app-testwebpack)
  - [Decision matrix](#decision-matrix)
  - [Related documentation](#related-documentation)

---

## Quick reference

| Package                      | Path                       | Automated tests        | How to verify changes                     |
| :--------------------------- | :------------------------- | :--------------------- | :---------------------------------------- |
| `@unsetsoft/ryunixjs`        | `packages/core`            | **Yes** (Jest + jsdom) | `pnpm --filter @unsetsoft/ryunixjs test`  |
| `@unsetsoft/ryunix-presets`  | `packages/ryunix-presets`  | No                     | Local `test/webpack` app + `pnpm run:web` |
| `@unsetsoft/cra`             | `packages/cra`             | No                     | Run the CLI into a temp directory         |
| `@unsetsoft/ryunix-devtools` | `packages/ryunix-devtools` | No                     | Load extension in Chrome + Ryunix app     |
| **Monorepo root**            | `/`                        | Turbo runs core `test` | `pnpm test`, `pnpm lint`, `pnpm build`    |

The `test/` folder is **gitignored**: each maintainer creates a local
**integration app** (see below). It is not committed to the repository.

---

## Local development without npm: linked dependencies

When a maintainer talks about **“linking local deps”**, they mean your test app
should **not download** `@unsetsoft/ryunixjs` or `@unsetsoft/ryunix-presets`
from npm, but use the code already in `packages/core` and
`packages/ryunix-presets`.

In this monorepo you **do not need** to run `pnpm link` manually. pnpm
workspaces handle it with the `workspace:*` protocol in the app `package.json`:

```json
{
  "dependencies": {
    "@unsetsoft/ryunixjs": "workspace:*"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "workspace:*"
  }
}
```

After `pnpm install`, `node_modules` does not contain a registry copy: it
contains a **symlink** to the local package:

```text
test/webpack/node_modules/@unsetsoft/ryunixjs
        │
        └── symlink → packages/core/
```

Root `pnpm.overrides` also force `workspace:*` across the monorepo so nothing
accidentally resolves to published npm versions.

|                        | npm / registry                  | local deps (`workspace:*`)             |
| :--------------------- | :------------------------------ | :------------------------------------- |
| Source                 | npm registry                    | local `packages/*` folders             |
| Change `packages/core` | not reflected                   | yes, after `build` + reload            |
| Typical dependency     | `"@unsetsoft/ryunixjs": "^1.x"` | `"@unsetsoft/ryunixjs": "workspace:*"` |
| Manual linking         | n/a                             | not needed (`pnpm link`)               |

### Monorepo mental map

```text
Ryunixjs/  (root — NOT a Ryunix app)
├── packages/core              → UI engine
├── packages/ryunix-presets    → ryunix CLI + Webpack
├── packages/cra               → app scaffolder
├── packages/ryunix-devtools   → Chrome extension
└── test/webpack               → your local app (gitignored, you create it)
         │
         └── workspace:* → local code, not npm
```

> **Important:** root `pnpm dev` does **not** open the framework in a browser.
> Today it only starts CRA’s interactive CLI. To see the framework running, use
> **`pnpm run:web`**.

---

## Requirements

- **Node.js**: 20, 22, or 24 (>= 22 recommended; see `CONTRIBUTING.md`).
- **pnpm**: v10+ (see root `packageManager`).
- After cloning: `pnpm install` at the monorepo root.

---

## Typical maintainer workflow

### One-time setup

```bash
pnpm install

# Create test/webpack (see «Local integration app»)

pnpm build
pnpm run:web
```

Day to day:

```text

1. Code in test/webpack/app/        → HMR reloads on save
2. Change packages/core              → pnpm --filter @unsetsoft/ryunixjs build → refresh browser
3. Change packages/ryunix-presets    → restart pnpm run:web
4. Change packages/ryunix-devtools   → Reload extension on chrome://extensions/
5. Fix ready in packages/*           → git add / commit / PR (framework only, not test/)
```

**Analogy:** React and Next are developed alongside an example app; in Ryunix
that app is `test/webpack`.

---

## Global commands (from repository root)

| Command              | Purpose                                                                                                   |
| :------------------- | :-------------------------------------------------------------------------------------------------------- |
| `pnpm install`       | Install all workspace dependencies.                                                                       |
| `pnpm build`         | Build packages (Turbo; `build` depends on `^build`).                                                      |
| `pnpm test`          | Run `test` in packages that define it (currently **core** only). Turbo runs `build` first (`turbo.json`). |
| `pnpm lint`          | Root ESLint + per-package lint via Turbo.                                                                 |
| `pnpm lint:fix`      | Fix lint and format with Prettier.                                                                        |
| `pnpm run:web`       | `ryunix dev` on `test/webpack` (requires local app).                                                      |
| `pnpm run:web:build` | `ryunix build` on the test app.                                                                           |
| `pnpm run:web:start` | `ryunix start` (production) on the test app.                                                              |

### Before opening a PR

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

The GitHub workflow (`.github/workflows/eslint.yml`) runs **lint** only, not
Jest. Core tests are expected to pass locally until CI adds a test job.

---

## `@unsetsoft/ryunixjs` (`packages/core`)

UI engine: reconciler, hooks, render. The **only package with unit tests** in
the monorepo.

### Stack

- **Jest** 30 + **babel-jest** + **jest-environment-jsdom**
- Config: `packages/core/jest.config.cjs`
- Global setup: `packages/core/jest.setup.js` (`requestIdleCallback` /

  `cancelIdleCallback` polyfills)

- Tests: `packages/core/src/tests/**/*.test.js`
- Babel: `packages/core/babel.config.json`

### Run core tests only

```bash

# From root (recommended)

pnpm --filter @unsetsoft/ryunixjs test

# From package directory

cd packages/core && pnpm test
```

Watch mode:

```bash
cd packages/core
pnpm exec jest --testPathPattern=src --watch
```

### Adding a new test

1. Create `packages/core/src/tests/<name>.test.js`.
2. Import from `../lib/...` (source, not `dist/`).
3. Call `workLoop({ timeRemaining: () => 100 })` after actions that trigger

   async reconciler updates.

4. Mount with `Ryunix.init()` and a `div` on `document.body` (see reference

   test).

Reference: `packages/core/src/tests/TestComponent.test.js` (`useStore` and DOM
updates).

### Current limitations

- No automated SSR/SSG integration tests in core; use the `test/webpack` app.
- If `jest: command not found`, run `pnpm install` at the monorepo root.

---

## `@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)

`ryunix` CLI, dual Webpack, routing, SSG, APIs. **No `test` script** or Jest
suite.

### How to test

1. **Build core** (peer dependency on `@unsetsoft/ryunixjs`):

   ```bash
   pnpm --filter @unsetsoft/ryunixjs build
   ```

1. Use the local **integration app** (`test/webpack`) linked to the workspace

   (below).

1. Root scripts:

   ```bash
   pnpm run:web          # ryunix dev — HMR, dev SSR
   pnpm run:web:build    # ryunix build — SSG, bundles
   pnpm run:web:start    # ryunix start — production server
   ```

1. Debug the CLI directly:

   ```bash
   cd test/webpack
   pnpm exec ryunix dev
   ```

### Manual checklist

| Area            | What to check                                             |
| :-------------- | :-------------------------------------------------------- |
| Routing         | Routes under `app/`, layouts, `errors.ryx`                |
| Build           | `ryunix build` succeeds; artifacts under `.ryunix/`       |
| SSR / hydration | Browser without hydration errors                          |
| API             | `app/api/**/router.js` in dev and after `build` + `start` |
| MDX / loaders   | `.mdx` pages if added to the test app                     |

See [CLI and bootstrapping](./ryunix-presets/cli-and-bootstrapping.md),
[Routing and SSG](./ryunix-presets/routing-and-ssg.md).

---

## `@unsetsoft/cra` (`packages/cra`)

`npx @unsetsoft/cra` scaffolder. **No automated tests.**

### Run the CLI from the monorepo

```bash
pnpm --filter @unsetsoft/cra dev

# Or with Node

node packages/cra/src/cli.js ../_cra/my-test-app --latest
```

Use a folder outside `test/` (e.g. `_cra/`, gitignored) to avoid mixing with the
webpack integration app.

### What to verify

| Step           | Check                                                           |
| :------------- | :-------------------------------------------------------------- |
| Scaffolding    | Template copied (`ryunix-base`, `--tailwind`, `--eslint`, etc.) |
| `package.json` | `@unsetsoft/ryunixjs` and `@unsetsoft/ryunix-presets` resolved  |
| Install        | Package manager step completes                                  |
| Generated app  | `pnpm dev` / `npm run dev` starts `ryunix dev`                  |

Flags: `--canary`, `--tailwind`, `--eslint`, `--compiler swc|babel`.

See [CLI and helpers](./cra/cli-and-helpers.md),
[Template generation](./cra/template-generation.md).

---

## `@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)

Browser extension (Manifest V3). **No automated tests** in the monorepo.

### Manual setup

1. Run a Ryunix app (`pnpm run:web` or a CRA-generated project).
2. Chrome: `chrome://extensions/` → **Developer mode** → **Load unpacked**.
3. Select `packages/ryunix-devtools`.

### What to verify (CRA)

- **Ryunix** tab in DevTools (F12).
- Component tree, props, app detection.
- After editing extension files, **Reload** on `chrome://extensions/`.

See `packages/ryunix-devtools/README.md`.

---

## Local integration app (`test/webpack`)

Not in git (`.gitignore`). Root scripts `pnpm run:web*` expect
`test/webpack/package.json` in the workspace (`pnpm-workspace.yaml`).

### Inside the repo or in a separate folder?

|                         | `test/webpack` (inside repo)                         | External folder (outside repo)                          |
| :---------------------- | :--------------------------------------------------- | :------------------------------------------------------ |
| Link to framework       | Automatic via `workspace:*`                          | Manual: `file:../Ryunixjs/packages/core` or `pnpm link` |
| `pnpm run:web*` scripts | Work from root                                       | No; cd into your app and run `pnpm dev`                 |
| Git / commits           | `test/` is gitignored — app **never** gets committed | Separate repo or no git                                 |
| Best for                | Developing and contributing to the framework         | Long-lived “real” app, separate git history             |

**Recommendation:** use `test/webpack` inside the monorepo. Official workflow,
scripts ready, no test code polluting git history.

If you scaffold with CRA **outside** `test/` (e.g. `_cra/my-app`, also
gitignored), point dependencies at the monorepo manually:

```json
{
  "dependencies": {
    "@unsetsoft/ryunixjs": "file:../Ryunixjs/packages/core"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "file:../Ryunixjs/packages/ryunix-presets"
  }
}
```

Every framework change requires `build` in the monorepo and restarting or
reloading the external app.

### Git and commits: what goes in and what stays out

Think in **two layers**:

```text
┌─────────────────────────────────────┐
│  Framework (packages/, docs/)       │  → yes: commits, PRs, canary branch
├─────────────────────────────────────┤
│  Test app (test/webpack)            │  → no: gitignored, local only
└─────────────────────────────────────┘
```

| What you change                          | Shows in `git status`? | Action                    |
| :--------------------------------------- | :--------------------- | :------------------------ |
| `packages/core`, presets, CRA, devtools  | **Yes**                | Commit and PR to `canary` |
| `test/webpack/app/*.ryx`, routes, styles | **No**                 | Local testing only        |
| `docs/`                                  | **Yes**                | Normal commit             |

The entire `test/` folder is in `.gitignore`. You can add routes, APIs, and test
components without accidentally committing them. Only version framework changes
under `packages/` (and `docs/` when applicable).

### Create the app (one-time)

### Option A — CRA inside the monorepo

```bash
mkdir -p test
node packages/cra/src/cli.js test/webpack-app --latest

# Move/rename to test/webpack as needed

```

After scaffolding, edit `test/webpack/package.json` and replace npm versions
with `workspace:*` (as in option B).

### Option B — Copy template and link workspace (recommended)

1. Copy the base template:

   ```bash
   mkdir -p test
   cp -r packages/cra/templates/ryunix-base test/webpack
   cp packages/cra/templates/ryunix-base/gitignore test/webpack/.gitignore
   ```

1. Set `test/webpack/package.json`:

```json
{
  "name": "ryunix-webpack-test",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "ryunix dev",
    "build": "ryunix build",
    "start": "ryunix start"
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

1. From the **monorepo root**:

```bash
pnpm install
pnpm build
pnpm run:web
```

Root `pnpm.overrides` force workspace packages instead of published npm
versions.

### Verify you are using local code

After `pnpm install`, confirm the link points into the monorepo:

```bash
ls -la test/webpack/node_modules/@unsetsoft/ryunixjs

# Should be a symlink to packages/core

```

`test/webpack/package.json` must use `"workspace:*"`, not npm version numbers.

### App code structure

The app under `test/webpack/` follows Ryunix conventions (not Next.js):

```text
test/webpack/
├── app/
│   ├── index.ryx              ← home page (/)
│   ├── layout.ryx             ← global layout
│   ├── errors.ryx             ← error handling
│   ├── about/index.ryx        ← /about route
│   └── api/hello/router.js    ← /api/hello
├── styles/global.css
├── assets/
├── ryunix.config.js           ← framework config
└── package.json               ← workspace:* to core and presets
```

Example page (`app/index.ryx`):

```jsx
export const Metatags = {
  title: 'My local test',
}

export default function Index() {
  return (
    <main>
      <h1>Testing local Ryunix</h1>
    </main>
  )
}
```

New routes: add folders under `app/` (e.g. `app/about/index.ryx` → `/about`).
The Webpack plugin generates the router at compile time.

Components used by a single route: colocate next to that route or in an `app/`
subfolder. Promote to a shared folder only when a **second consumer** needs
them.

### Typical workflow after code changes

| Changed                             | Steps                                                       |
| :---------------------------------- | :---------------------------------------------------------- |
| `test/webpack/app/*.ryx` (your app) | Save → HMR reloads                                          |
| `packages/core`                     | `pnpm --filter @unsetsoft/ryunixjs build` → refresh browser |
| `packages/ryunix-presets`           | Restart `pnpm run:web` (Webpack/CLI in memory)              |
| `packages/ryunix-devtools`          | Reload extension on `chrome://extensions/`                  |
| CRA templates                       | Regenerate test app or copy files manually                  |

Production commands from root:

```bash
pnpm run:web:build    # ryunix build — SSG, bundles in .ryunix/
pnpm run:web:start    # ryunix start — production server
```

---

## Decision matrix

```text
Hooks / reconciler / render?
  → Jest in packages/core + build + run:web

Webpack / CLI / routing / SSG?
  → run:web (test/webpack) + lint

CRA templates or CLI?
  → node packages/cra/src/cli.js <dir> + dev in generated app

DevTools extension?
  → load packages/ryunix-devtools + Ryunix app in browser
```

---

## Related documentation

| Topic            | Link                                         |
| :--------------- | :------------------------------------------- |
| Repository guide | [repository-guide.md](./repository-guide.md) |
| Contributing     | [CONTRIBUTING.md](../../CONTRIBUTING.md)     |
| Docs index       | [overview.md](./overview.md)                 |
