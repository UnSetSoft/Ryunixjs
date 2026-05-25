<!-- markdownlint-disable MD013 MD060 -->

# `packages/core` — `@unsetsoft/ryunixjs`

**Runtime engine** of RyunixJS: Virtual DOM, Fiber reconciler, hooks, client and
server rendering, built-in components, and Server Action helpers. This is what
executes UI in the browser and on Node during SSR. Published to npm as
[`@unsetsoft/ryunixjs`](https://www.npmjs.com/package/@unsetsoft/ryunixjs).

**Read next:** [vdom-and-reconciliation.md](./vdom-and-reconciliation.md) and
[hooks.md](./hooks.md).

---

## Role in the monorepo

| Aspect               | Detail                                                                           |
| :------------------- | :------------------------------------------------------------------------------- |
| **Consumers**        | Every Ryunix app; `@unsetsoft/ryunix-presets` bundles or externalizes it for SSR |
| **Out of scope**     | Project compilation, route generation, app CLI                                   |
| **Published output** | `dist/` (Rollup) + `jsx/` (JSX runtimes, not rolled up)                          |
| **Tests**            | Jest in `src/tests/` — main target of root `pnpm test`                           |

```mermaid
flowchart TB
  App[Ryunix app .ryx]
  Presets[@unsetsoft/ryunix-presets]
  Core[@unsetsoft/ryunixjs]
  App --> Presets
  Presets -->|client bundle / SSR external| Core
  Core --> DOM[Browser DOM]
  Core --> HTML[SSR HTML / stream]
```

---

## Package layout

```text
packages/core/
├── src/
│   ├── main.js                 # Rollup entry; sets window.Ryunix in browser
│   ├── lib/                    # Engine (see table below)
│   ├── tests/                  # Jest
│   └── utils/
│       ├── index.js            # Global reconciler state, types, helpers
│       └── svgAttributes.js
├── jsx/
│   ├── jsx-runtime.js          # jsx, jsxs, Fragment (MDX, importSource)
│   └── jsx-dev-runtime.js
├── rollup.config.js
├── jest.config.cjs
├── package.json                # exports: ".", "./jsx-runtime", "./jsx-dev-runtime"
└── dist/                       # Build output (gitignored)
```

### Main modules in `src/lib/`

| File                                                  | Responsibility                                                 |
| :---------------------------------------------------- | :------------------------------------------------------------- |
| `index.js`                                            | Public API barrel                                              |
| `createElement.js`                                    | VDOM: `createElement`, `Fragment`, text nodes                  |
| `render.js`                                           | `render`, `hydrate`, `init`, `safeRender`                      |
| `workers.js`                                          | Fiber work loop                                                |
| `reconciler.js`                                       | Child diff by `key`                                            |
| `components.js`                                       | Fiber updates; built-ins (`Image`, MDX, …)                     |
| `dom.js`                                              | DOM create/update, events, styles                              |
| `commits.js`                                          | Commit phase and `commitRoot`                                  |
| `hooks.js`                                            | Hooks + router (`useStore`, `Link`, …)                         |
| `server.js`                                           | `renderToString`, streams                                      |
| `serverActions.js` / `serverBoundary.js`              | Server Actions and boundaries                                  |
| `lazy.js` / `memo.js` / `portal.js` / `forwardRef.js` | React-like patterns                                            |
| `errorBoundary.js` / `devOverlay.js`                  | Client errors and dev overlay                                  |
| `devtools.js` / `profiler.js`                         | Dev warnings and in-memory profiler (not the Chrome extension) |

### Client render flow (summary)

1. `render` / `hydrate` sets up the root fiber.
2. `workers.scheduleWork` runs the work loop.
3. `components` + `reconciler` compute the fiber tree.
4. `commits` + `dom` apply DOM updates and run effects.

---

## How apps consume the core

Ryunix apps rarely hand-write imports in every `.ryx` file:

| Mechanism           | Where             | Effect                            |
| :------------------ | :---------------- | :-------------------------------- |
| `ProvidePlugin`     | Preset Webpack    | Global `Ryunix` on client bundles |
| Babel/SWC           | `.ryx` compile    | JSX → `Ryunix.createElement`      |
| Generated bootstrap | `AppRouterPlugin` | Explicit imports in `main.ryx`    |
| MDX                 | MDX loader        | `jsxImportSource` → `jsx-runtime` |
| Server Actions      | Preset loader     | `createActionProxy` from core     |

**npm exports:** `"."`, `"./jsx-runtime"`, `"./jsx-dev-runtime"`.

Monorepo: `workspace:*` and `pnpm run build:core` before local app testing.

---

## Commands

```bash
pnpm --filter @unsetsoft/ryunixjs run build
pnpm --filter @unsetsoft/ryunixjs run test
pnpm --filter @unsetsoft/ryunixjs run lint
```

Maintainer release: `pnpm run release:canary` or `pnpm run release:stable` at repo root.

---

## Related packages

| Package           | Relationship                               |
| :---------------- | :----------------------------------------- |
| `ryunix-presets`  | Builds apps; peer on core                  |
| `cra`             | Adds `@unsetsoft/ryunixjs` to new projects |
| `ryunix-devtools` | Patches `window.Ryunix` in the browser     |
| `ryunix-vscode`   | Editor completions for core exports        |

---

## Docs in `docs/en/core/`

| Document                                                   | Topic                 |
| :--------------------------------------------------------- | :-------------------- |
| [vdom-and-reconciliation.md](./vdom-and-reconciliation.md) | Fibers and reconciler |
| [hooks.md](./hooks.md)                                     | State and effects     |
| [rendering.md](./rendering.md)                             | SSR and hydration     |
| [server-functions.md](./server-functions.md)               | Server Actions        |
| [devtools-and-profiler.md](./devtools-and-profiler.md)     | Core dev tooling      |

Spanish: [docs/es/core/resumen-paquete.md](../../es/core/resumen-paquete.md).
