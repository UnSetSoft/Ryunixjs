# `packages/core` — `@unsetsoft/ryunixjs`

Runtime engine of RyunixJS: Virtual DOM, Fiber reconciler, hooks, client/server
rendering, and built-in components. Published to npm as
[`@unsetsoft/ryunixjs`](https://www.npmjs.com/package/@unsetsoft/ryunixjs).

---

## Role in the monorepo

| Aspect           | Detail                                                                  |
| :--------------- | :---------------------------------------------------------------------- |
| **Consumer**     | Every Ryunix app and `@unsetsoft/ryunix-presets` (peer dependency)      |
| **Build output** | Rollup bundles in `dist/` plus JSX runtimes under `jsx/`                |
| **Tests**        | Jest suite in `src/tests/` — main automated test target of the monorepo |

---

## Layout

```text
packages/core/
├── src/lib/           # Reconciler, hooks, render, components
├── src/tests/         # Jest tests
├── jsx/               # jsx-runtime and jsx-dev-runtime
├── rollup.config.js
└── package.json
```

---

## Commands

From the repository root (after `pnpm install`):

```bash
pnpm --filter @unsetsoft/ryunixjs run build
pnpm --filter @unsetsoft/ryunixjs run test
pnpm --filter @unsetsoft/ryunixjs run lint
```

Release (maintainers): `pnpm run release:canary` or `pnpm run release:stable`
at the monorepo root bumps versions via `gmvu` and publishes with provenance.

---

## Related docs

| Topic                        | Document                                                                         |
| :--------------------------- | :------------------------------------------------------------------------------- |
| Virtual DOM & reconciliation | [virtual-dom-and-reconciliation.md](./virtual-dom-and-reconciliation.md)         |
| Hooks                        | [hooks.md](./hooks.md)                                                           |
| Rendering & SSR              | [rendering.md](./rendering.md)                                                   |
| Server Actions / RSC         | [server-features.md](./server-features.md)                                       |
| DevTools hooks in core       | [devtools-and-profiler.md](./devtools-and-profiler.md)                           |
| Browser DevTools extension   | [../ryunix-devtools/package-overview.md](../ryunix-devtools/package-overview.md) |
