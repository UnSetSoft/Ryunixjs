# `packages/core` — `@unsetsoft/ryunixjs`

Motor de runtime de RyunixJS: Virtual DOM, reconciliador Fiber, hooks,
renderizado cliente/servidor y componentes integrados. Publicado en npm como
[`@unsetsoft/ryunixjs`](https://www.npmjs.com/package/@unsetsoft/ryunixjs).

---

## Rol en el monorepo

| Aspecto | Detalle |
| :------ | :------ |
| **Consumidor** | Toda app Ryunix y `@unsetsoft/ryunix-presets` (peer dependency) |
| **Salida de build** | Bundles Rollup en `dist/` y runtimes JSX en `jsx/` |
| **Tests** | Suite Jest en `src/tests/` — principal objetivo de tests automatizados |

---

## Estructura

```text
packages/core/
├── src/lib/           # Reconciliador, hooks, render, componentes
├── src/tests/         # Tests Jest
├── jsx/               # jsx-runtime y jsx-dev-runtime
├── rollup.config.js
└── package.json
```

---

## Comandos

Desde la raíz del repositorio (tras `pnpm install`):

```bash
pnpm --filter @unsetsoft/ryunixjs run build
pnpm --filter @unsetsoft/ryunixjs run test
pnpm --filter @unsetsoft/ryunixjs run lint
```

Release (mantenedores): `pnpm run release:canary` o `pnpm run release:stable` en
la raíz del monorepo (versiones con `gmvu` y publicación con provenance).

---

## Documentación relacionada

| Tema | Documento |
| :--- | :-------- |
| VDOM y reconciliación | [vdom-y-reconciliacion.md](./vdom-y-reconciliacion.md) |
| Hooks | [hooks.md](./hooks.md) |
| Renderizado y SSR | [renderizado.md](./renderizado.md) |
| Server Actions / RSC | [funciones-servidor.md](./funciones-servidor.md) |
| DevTools en el core | [devtools-y-profiler.md](./devtools-y-profiler.md) |
| Extensión Chrome DevTools | [../ryunix-devtools/resumen-paquete.md](../ryunix-devtools/resumen-paquete.md) |
