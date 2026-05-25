# Ryunix Core — package overview

> **Language / Idioma:** [English](./package-overview.md) ·
> [Español](../../es/core/resumen-del-paquete.md)

The npm package **`@unsetsoft/ryunixjs`** lives in `packages/core/`. It is the
**UI engine** of RyunixJS: Virtual DOM, Fiber reconciler, hooks, client render,
SSR, and hydration. Apps depend on it at runtime; the build toolchain
(`@unsetsoft/ryunix-presets`) bundles it into client and server chunks.

---

## Table of contents

- [Ryunix Core — package overview](#ryunix-core--package-overview)
  - [Table of contents](#table-of-contents)
  - [Role in the monorepo](#role-in-the-monorepo)
  - [Public usage](#public-usage)
  - [Layout of `packages/core/`](#layout-of-packagescore)
  - [Main modules (`src/lib/`)](#main-modules-srclib)
  - [Build, types, and TypeScript](#build-types-and-typescript)
  - [High-level flow](#high-level-flow)
  - [Related documentation](#related-documentation)

---

## Role in the monorepo

| Package                      | Responsibility                                           |
| :--------------------------- | :------------------------------------------------------- |
| `@unsetsoft/ryunixjs`        | Browser runtime and SSR render APIs                      |
| `@unsetsoft/ryunix-presets`  | Compiles `.ryx` / JS and bundles core into the app       |
| `@unsetsoft/cra`             | Scaffolds projects that declare core in `package.json`   |
| `@unsetsoft/ryunix-devtools` | Chrome debugging for Ryunix apps (does not replace core) |

Core does **not** own `app/` routes, `ryunix.config.js`, or the `ryunix` CLI.
It only exports the library the bundler includes in client and server output.

---

## Public usage

In a Ryunix app (from CRA or manual setup):

```json
{
  "dependencies": {
    "@unsetsoft/ryunixjs": "^1.2.x"
  }
}
```

Typical imports (depending on preset config):

```javascript
import { render, useStore, createElement } from '@unsetsoft/ryunixjs'
```

JSX uses the package runtime:

```javascript
// app package.json
"imports": {
  "ryunix/jsx-runtime": "@unsetsoft/ryunixjs/jsx-runtime"
}
```

Consumer types: `types/index.d.ts` and `jsx/*.d.ts` (migration **goal A**,
done).

---

## Layout of `packages/core/`

```text
packages/core/
├── package.json          # exports → dist/ + jsx-runtime; "types" → types/
├── rollup.config.js      # ESM + UMD (+ min) into dist/
├── tsconfig.json         # typecheck over src/**/*.ts
├── tsconfig.checkjs.json # checkJs over lib + utils (JSDoc)
├── tsconfig.emit.json    # selective .ts → .js emit under src/
├── src/
│   ├── main.ts           # Re-exports lib/; sets window.Ryunix in browser
│   ├── lib/              # Engine (see table below)
│   ├── utils/            # Shared helpers (e.g. SVG, state)
│   ├── types/            # internal.d.ts for checkJs
│   └── tests/            # Jest (TestComponent, etc.)
├── jsx/
│   ├── jsx-runtime.js    # createElement for the compiler
│   └── jsx-dev-runtime.js
├── types/
│   └── index.d.ts        # Public typed API on npm
└── dist/                 # Published artifact (do not hand-edit)
    ├── Ryunix.esm.js
    ├── Ryunix.umd.js
    └── Ryunix.umd.min.js
```

What npm publishes (`files`: `dist`, `jsx`, `types`) does **not** ship `src/`.
Maintainers work in the monorepo and run `build` before publish.

---

## Main modules (`src/lib/`)

| Area          | Files (`.ts` / `.js` source)                                     | Docs                                                                                             |
| :------------ | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| VDOM & tree   | `createElement`, `reconciler`, `commits`, `dom`                  | [virtual-dom-and-reconciliation.md](./virtual-dom-and-reconciliation.md)                         |
| Client render | `render`, `effects`                                              | [rendering.md](./rendering.md)                                                                   |
| State         | `hooks`, `batching`, `priority`, `memo`                          | [hooks.md](./hooks.md), [state-and-priority.md](./state-and-priority.md)                         |
| Components    | `lazy`, `portal`, `forwardRef`, `components`                     | [advanced-components.md](./advanced-components.md)                                               |
| Server        | `server`, `serverActions`, `serverBoundary`, `bridge`, `workers` | [server-features.md](./server-features.md)                                                       |
| Errors & DX   | `errorBoundary`, `devOverlay`, `devtools`, `profiler`            | [error-boundary.md](./error-boundary.md), [devtools-and-profiler.md](./devtools-and-profiler.md) |
| Entry         | `index.ts`                                                       | Re-exports public API                                                                            |

**Source migration to TypeScript is in progress**: many modules have paired
`.ts` + `.js`; Rollup builds from `src/main.js` with
`@rollup/plugin-typescript` over `src/**/*.ts`.

---

## Build, types, and TypeScript

| Script              | Command                        | Purpose                                  |
| :------------------ | :----------------------------- | :--------------------------------------- |
| `build`             | `rollup -c`                    | Bundles in `dist/` for publish           |
| `build:lib-ts`      | `tsc -p tsconfig.emit.json`    | Selective emit under `src/` (prepublish) |
| `typecheck`         | `tsc --noEmit`                 | `.ts` sources                            |
| `typecheck:checkjs` | `tsc -p tsconfig.checkjs.json` | `.js` with JSDoc in lib/utils            |
| `test`              | `jest`                         | Tests under `src/tests/`                 |

`prepublishOnly` runs `build:lib-ts` then `build`.

Phases: [TypeScript in the monorepo](../guides/typescript-in-the-monorepo.md).

---

## High-level flow

```mermaid
flowchart TB
  subgraph dev ["Maintainer"]
    SRC[src/lib + main.ts]
    ROLL[rollup build]
    SRC --> ROLL
    ROLL --> DIST[dist/*.js]
  end
  subgraph app ["Ryunix app"]
    RYX[app/*.ryx]
    PRE[@unsetsoft/ryunix-presets]
    RYX --> PRE
  end
  subgraph browser ["Browser"]
    CORE[@unsetsoft/ryunixjs]
    DOM[Updated DOM]
    CORE --> DOM
  end
  DIST --> PRE
  PRE --> CORE
```

1. The preset compiles pages and resolves `@unsetsoft/ryunixjs` in client and
   server bundles.
2. On the client, `render` / `hydrate` mount the Fiber tree and the reconciler
   commits to the DOM.
3. For SSR, `renderToString` / streaming use `server.js` and related APIs.

---

## Related documentation

| Document                                                                    | Content                    |
| :-------------------------------------------------------------------------- | :------------------------- |
| [virtual-dom-and-reconciliation.md](./virtual-dom-and-reconciliation.md)    | Fiber, work loop, commit   |
| [hooks.md](./hooks.md)                                                      | State and effects          |
| [rendering.md](./rendering.md)                                              | Client, hydration, SSR     |
| [server-features.md](./server-features.md)                                  | Server Actions, boundaries |
| [ryunix-presets/package-overview.md](../ryunix-presets/package-overview.md) | How apps bundle core       |
| `packages/core/README.md`                                                   | High-level intro and API   |
