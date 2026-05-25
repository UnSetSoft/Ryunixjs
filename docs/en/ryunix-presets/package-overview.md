# `packages/ryunix-presets` — `@unsetsoft/ryunix-presets`

Build tooling for Ryunix apps: the `ryunix` CLI, dual Webpack configs (client +
server), file-based routing, SSG, API route compilation, and custom loaders (RSC,
Server Actions).

---

## Role in the monorepo

| Aspect | Detail |
| :----- | :----- |
| **Consumer** | Generated apps and `test/webpack` integration app |
| **Peer** | `@unsetsoft/ryunixjs` (runtime imported by app bundles) |
| **Shipped as** | Source under `webpack/` (no separate build step in CI) |

---

## Layout

```text
packages/ryunix-presets/
└── webpack/
    ├── bin/index.mjs        # ryunix dev | build | start
    ├── webpack.config.mjs   # Client + server compilers
    ├── plugins/             # AppRouterPlugin, SSG, etc.
    └── loaders/             # RSC, Server Actions, .ryx
```

Apps depend on `@unsetsoft/ryunix-presets/webpack` and run scripts via the
`ryunix` binary.

---

## Commands

In an app directory (or `test/webpack`):

```bash
pnpm run dev      # → ryunix dev
pnpm run build    # → ryunix build
pnpm run start    # → ryunix start
```

From the monorepo root, lint only:

```bash
pnpm --filter @unsetsoft/ryunix-presets exec eslint webpack --max-warnings=0 --config ../../eslint.config.mjs
```

---

## Related docs

| Topic | Document |
| :---- | :------- |
| CLI & bootstrapping | [cli-and-bootstrapping.md](./cli-and-bootstrapping.md) |
| Routing & SSG | [routing-and-ssg.md](./routing-and-ssg.md) |
| API routes | [api-router.md](./api-router.md) |
| Webpack loaders | [webpack-loaders.md](./webpack-loaders.md) |
| `ryunix.config.js` | [configuration-loading.md](./configuration-loading.md) |
