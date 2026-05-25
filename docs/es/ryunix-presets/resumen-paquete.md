# `packages/ryunix-presets` — `@unsetsoft/ryunix-presets`

Tooling de build para apps Ryunix: CLI `ryunix`, Webpack dual (cliente +
servidor), routing por archivos, SSG, compilación de rutas API y loaders
personalizados (RSC, Server Actions).

---

## Rol en el monorepo

| Aspecto | Detalle |
| :------ | :------ |
| **Consumidor** | Apps generadas y la app de integración `test/webpack` |
| **Peer** | `@unsetsoft/ryunixjs` (runtime importado por los bundles de la app) |
| **Se distribuye como** | Código fuente en `webpack/` (sin paso de build separado en CI) |

---

## Estructura

```text
packages/ryunix-presets/
└── webpack/
    ├── bin/index.mjs        # ryunix dev | build | start
    ├── webpack.config.mjs   # Compiladores cliente + servidor
    ├── plugins/             # AppRouterPlugin, SSG, etc.
    └── loaders/             # RSC, Server Actions, .ryx
```

Las apps dependen de `@unsetsoft/ryunix-presets/webpack` y ejecutan scripts con
el binario `ryunix`.

---

## Comandos

En el directorio de una app (o `test/webpack`):

```bash
pnpm run dev      # → ryunix dev
pnpm run build    # → ryunix build
pnpm run start    # → ryunix start
```

Desde la raíz del monorepo, solo lint:

```bash
pnpm --filter @unsetsoft/ryunix-presets exec eslint webpack --max-warnings=0 --config ../../eslint.config.mjs
```

---

## Documentación relacionada

| Tema | Documento |
| :--- | :-------- |
| CLI y arranque | [cli-y-arranque.md](./cli-y-arranque.md) |
| Routing y SSG | [enrutamiento-y-ssg.md](./enrutamiento-y-ssg.md) |
| Rutas API | [enrutador-api.md](./enrutador-api.md) |
| Loaders Webpack | [loaders-webpack.md](./loaders-webpack.md) |
| `ryunix.config.js` | [carga-de-configuracion.md](./carga-de-configuracion.md) |
