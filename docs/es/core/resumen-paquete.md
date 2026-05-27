<!-- markdownlint-disable MD013 MD060 -->

# `packages/core` — `@unsetsoft/ryunixjs`

Motor de **runtime** de RyunixJS: Virtual DOM, reconciliador basado en fibers,
hooks, renderizado en cliente y servidor, componentes integrados y utilidades
para Server Actions. Es el paquete que ejecuta la UI en el navegador y en Node
durante SSR. Publicado en npm como
[`@unsetsoft/ryunixjs`](https://www.npmjs.com/package/@unsetsoft/ryunixjs).

**Lectura recomendada después de este archivo:** [vdom-y-reconciliacion.md](./vdom-y-reconciliacion.md) y
[hooks.md](./hooks.md).

---

## Rol en el monorepo

| Aspecto              | Detalle                                                                                |
| :------------------- | :------------------------------------------------------------------------------------- |
| **Quién lo usa**     | Toda app Ryunix; `@unsetsoft/ryunix-presets` lo empaqueta o marca como external en SSR |
| **Qué no hace**      | No compila proyectos, no genera rutas, no ofrece CLI de app                            |
| **Salida publicada** | `dist/` (Rollup) + `jsx/` (runtimes JSX, sin pasar por Rollup)                         |
| **Tests**            | Jest en `src/tests/` — foco principal de `pnpm test` en el monorepo                    |

```mermaid
flowchart TB
  App[App Ryunix .ryx]
  Presets[@unsetsoft/ryunix-presets]
  Core[@unsetsoft/ryunixjs]
  App --> Presets
  Presets -->|bundle cliente / external SSR| Core
  Core --> DOM[Navegador DOM]
  Core --> HTML[HTML / stream SSR]
```

---

## Estructura del paquete

```text
packages/core/
├── src/
│   ├── main.ts                 # Entrada TypeScript → emit `.generated/main.js` → Rollup
│   ├── lib/                    # Motor (ver tabla abajo)
│   ├── tests/                  # Tests Jest
│   └── utils/
│       ├── index.js            # Estado global del reconciler, tipos, helpers
│       └── svgAttributes.js    # Atributos SVG válidos en DOM
├── jsx/
│   ├── jsx-runtime.js          # export jsx, jsxs, Fragment (MDX, importSource)
│   └── jsx-dev-runtime.js      # jsxDEV en desarrollo
├── rollup.config.js            # ESM + UMD (+ minificado)
├── jest.config.cjs
├── package.json                # exports: ".", "./jsx-runtime", "./jsx-dev-runtime"
└── dist/                       # Generado por build (no en git)
    ├── Ryunix.esm.js
    ├── Ryunix.umd.js
    └── Ryunix.umd.min.js
```

### Módulos principales en `src/lib/`

| Archivo                                               | Responsabilidad                                                      |
| :---------------------------------------------------- | :------------------------------------------------------------------- |
| `index.js`                                            | Barrel de la API pública reexportada por `main.js`                   |
| `createElement.js`                                    | VDOM: `createElement`, `Fragment`, `cloneElement`, nodos de texto    |
| `render.js`                                           | `render`, `hydrate`, `init`, `safeRender` — monta el fiber raíz      |
| `workers.js`                                          | Work loop Fiber: `performUnitOfWork`, `scheduleWork`                 |
| `reconciler.js`                                       | Diff de hijos por `key`                                              |
| `components.js`                                       | Actualización de fibers; componentes como `Image`, MDX               |
| `dom.js`                                              | Creación/actualización de nodos DOM, eventos, estilos                |
| `commits.js`                                          | Fase commit: effects, aplicar cambios, `commitRoot`                  |
| `hooks.js`                                            | Hooks + router: `useStore`, `useEffect`, `Link`, `RouterProvider`, … |
| `bridge.js`                                           | Rompe ciclos: inyecta `scheduleWork` en hooks                        |
| `batching.js` / `priority.js`                         | Agrupación y prioridades (`useTransition`, …)                        |
| `server.js`                                           | `renderToString`, streams, escape HTML                               |
| `serverActions.js`                                    | `createActionProxy` (stubs en cliente)                               |
| `serverBoundary.js`                                   | Límites solo-servidor en hidratación                                 |
| `lazy.js` / `memo.js` / `portal.js` / `forwardRef.js` | Patrones React-like                                                  |
| `errorBoundary.js` / `devOverlay.js`                  | Errores en cliente y overlay de dev                                  |
| `devtools.js` / `profiler.js`                         | Avisos de hooks y profiler en memoria (no es la extensión Chrome)    |

### Flujo de render en cliente (resumen)

1. `render` o `hydrate` crea/actualiza el fiber raíz.
2. `workers.scheduleWork` ejecuta el work loop.
3. `components` + `reconciler` calculan el árbol de fibers.
4. `commits` + `dom` aplican cambios al DOM y ejecutan effects.

---

## Cómo lo consumen las apps

En proyectos Ryunix **no suele haber** un `import` manual en cada `.ryx`:

| Mecanismo       | Dónde              | Efecto                                                                  |
| :-------------- | :----------------- | :---------------------------------------------------------------------- |
| `ProvidePlugin` | Webpack del preset | Global `Ryunix` en bundles cliente                                      |
| Babel/SWC       | Compilación `.ryx` | JSX → `Ryunix.createElement` / `Ryunix.Fragment`                        |
| Código generado | `AppRouterPlugin`  | `import { RouterProvider, … } from '@unsetsoft/ryunixjs'` en `main.ryx` |
| MDX             | Loader MDX         | `jsxImportSource: '@unsetsoft/ryunixjs'` → `jsx-runtime`                |
| Server Actions  | Loader del preset  | `createActionProxy` desde el core                                       |

**Exports npm** (`package.json`):

- `"."` → `dist/Ryunix.esm.js` (import) / `dist/Ryunix.umd.js` (require)
- `"./jsx-runtime"` / `"./jsx-dev-runtime"` → carpeta `jsx/`

En el monorepo local: `workspace:*` y ejecutar `pnpm run build:core` antes de probar apps.

---

## Comandos

Desde la raíz del repositorio:

```bash
pnpm --filter @unsetsoft/ryunixjs run build
pnpm --filter @unsetsoft/ryunixjs run test
pnpm --filter @unsetsoft/ryunixjs run lint
```

Release (mantenedores): `pnpm run release:canary` o `pnpm run release:stable` en la raíz
(versiones con `gmvu` y publicación con provenance).

---

## Relación con otros paquetes

| Paquete           | Relación                                                                            |
| :---------------- | :---------------------------------------------------------------------------------- |
| `ryunix-presets`  | Compila y sirve apps; peer del core; genera bootstrap con imports del core          |
| `cra`             | Añade `@unsetsoft/ryunixjs` al `package.json` de plantillas nuevas                  |
| `ryunix-devtools` | Parchea `window.Ryunix` en el navegador (no importa código del core para el bridge) |
| `ryunix-vscode`   | Completions de exports del core; no dependencia npm                                 |

---

## Documentación en `docs/es/core/`

| Documento                                              | Cuándo leerlo                                            |
| :----------------------------------------------------- | :------------------------------------------------------- |
| [vdom-y-reconciliacion.md](./vdom-y-reconciliacion.md) | Entender fibers, reconciler y commit                     |
| [hooks.md](./hooks.md)                                 | Estado, effects, router hooks                            |
| [renderizado.md](./renderizado.md)                     | `render`, `hydrate`, SSR y streaming                     |
| [estado-y-prioridad.md](./estado-y-prioridad.md)       | Batching y `useTransition`                               |
| [funciones-servidor.md](./funciones-servidor.md)       | Server Actions y `ServerBoundary`                        |
| [componentes-avanzados.md](./componentes-avanzados.md) | `lazy`, `Suspense`, `memo`, portals                      |
| [limites-de-error.md](./limites-de-error.md)           | Error boundaries                                         |
| [devtools-y-profiler.md](./devtools-y-profiler.md)     | Avisos en dev del core (distinto de la extensión Chrome) |

Par en inglés: [docs/en/core/package-overview.md](../../en/core/package-overview.md).
