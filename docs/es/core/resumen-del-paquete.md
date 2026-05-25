# Ryunix Core — resumen del paquete

> **Language / Idioma:** [English](../../en/core/package-overview.md) ·
> [Español](./resumen-del-paquete.md)

El paquete npm **`@unsetsoft/ryunixjs`** vive en `packages/core/`. Es el **motor
de UI** de RyunixJS: Virtual DOM, reconciliador Fiber, hooks, render en cliente,
SSR e hidratación. Las apps lo consumen como dependencia; el build (Webpack) lo
resuelve vía `@unsetsoft/ryunix-presets`.

---

## Índice

- [Ryunix Core — resumen del paquete](#ryunix-core--resumen-del-paquete)
  - [Índice](#índice)
  - [Rol en el monorepo](#rol-en-el-monorepo)
  - [Uso público](#uso-público)
  - [Estructura de `packages/core/`](#estructura-de-packagescore)
  - [Módulos principales (`src/lib/`)](#módulos-principales-srclib)
  - [Build, tipos y TypeScript](#build-tipos-y-typescript)
  - [Flujo de alto nivel](#flujo-de-alto-nivel)
  - [Documentación relacionada](#documentación-relacionada)

---

## Rol en el monorepo

| Paquete                      | Responsabilidad                                          |
| :--------------------------- | :------------------------------------------------------- |
| `@unsetsoft/ryunixjs`        | Runtime en navegador y APIs de render SSR                |
| `@unsetsoft/ryunix-presets`  | Compila `.ryx` / JS y empaqueta el core en la app        |
| `@unsetsoft/cra`             | Genera proyectos que declaran el core en `package.json`  |
| `@unsetsoft/ryunix-devtools` | Inspecciona apps Ryunix en Chrome (no sustituye al core) |

El core **no** define rutas `app/`, `ryunix.config.js` ni el CLI `ryunix`. Solo
exporta la librería que el bundler incluye en los chunks cliente y servidor.

---

## Uso público

En una app Ryunix (tras CRA o manual):

```json
{
  "dependencies": {
    "@unsetsoft/ryunixjs": "^1.2.x"
  }
}
```

Imports típicos (según configuración del preset):

```javascript
import { render, useStore, createElement } from '@unsetsoft/ryunixjs'
```

JSX usa el runtime del paquete:

```javascript
// package.json de la app
"imports": {
  "ryunix/jsx-runtime": "@unsetsoft/ryunixjs/jsx-runtime"
}
```

Tipos para consumidores: `types/index.d.ts` y `jsx/*.d.ts` (objetivo **A** de
migración TS, completado).

---

## Estructura de `packages/core/`

```text
packages/core/
├── package.json          # exports → dist/ + jsx-runtime; "types" → types/
├── rollup.config.js      # ESM + UMD (+ min) en dist/
├── tsconfig.json         # typecheck sobre src/**/*.ts
├── tsconfig.checkjs.json # checkJs sobre lib + utils (JSDoc)
├── tsconfig.emit.json    # emit puntual de algunos .ts → .js en src/
├── src/
│   ├── main.ts           # Reexporta lib/; expone window.Ryunix en browser
│   ├── lib/              # Motor (ver tabla abajo)
│   ├── utils/            # Utilidades compartidas (p. ej. SVG, estado)
│   ├── types/            # internal.d.ts para checkJs
│   └── tests/            # Jest (TestComponent, etc.)
├── jsx/
│   ├── jsx-runtime.js    # createElement para compilador
│   └── jsx-dev-runtime.js
├── types/
│   └── index.d.ts        # API pública tipada para npm
└── dist/                 # Artefacto publicado (no editar a mano)
    ├── Ryunix.esm.js
    ├── Ryunix.umd.js
    └── Ryunix.umd.min.js
```

Lo publicado en npm (`files`: `dist`, `jsx`, `types`) **no** incluye `src/`;
los mantenedores trabajan en el monorepo y ejecutan `build` antes de publicar.

---

## Módulos principales (`src/lib/`)

| Área           | Archivos (fuente `.ts` / `.js`)                                  | Tema en docs                                                                                     |
| :------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| VDOM y árbol   | `createElement`, `reconciler`, `commits`, `dom`                  | [vdom-y-reconciliacion.md](./vdom-y-reconciliacion.md)                                           |
| Render cliente | `render`, `effects`                                              | [renderizado.md](./renderizado.md)                                                               |
| Estado         | `hooks`, `batching`, `priority`, `memo`                          | [hooks.md](./hooks.md), [estado-y-prioridad.md](./estado-y-prioridad.md)                         |
| Componentes    | `lazy`, `portal`, `forwardRef`, `components`                     | [componentes-avanzados.md](./componentes-avanzados.md)                                           |
| Servidor       | `server`, `serverActions`, `serverBoundary`, `bridge`, `workers` | [funciones-servidor.md](./funciones-servidor.md)                                                 |
| Errores y DX   | `errorBoundary`, `devOverlay`, `devtools`, `profiler`            | [limites-de-error.md](./limites-de-error.md), [devtools-y-profiler.md](./devtools-y-profiler.md) |
| Entrada        | `index.ts`                                                       | Reexporta la API pública                                                                         |

La migración del **código fuente** a TypeScript está **en curso**: muchos
módulos tienen par `.ts` + `.js`; Rollup compila desde `src/main.js` con
`@rollup/plugin-typescript` sobre `src/**/*.ts`.

---

## Build, tipos y TypeScript

| Script              | Comando                        | Uso                                   |
| :------------------ | :----------------------------- | :------------------------------------ |
| `build`             | `rollup -c`                    | Bundles en `dist/` para publicar      |
| `build:lib-ts`      | `tsc -p tsconfig.emit.json`    | Emit selectivo en `src/` (prepublish) |
| `typecheck`         | `tsc --noEmit`                 | Fuentes `.ts`                         |
| `typecheck:checkjs` | `tsc -p tsconfig.checkjs.json` | `.js` con JSDoc en lib/utils          |
| `test`              | `jest`                         | Pruebas en `src/tests/`               |

`prepublishOnly` ejecuta `build:lib-ts` y luego `build`.

Detalle de fases: [TypeScript en el monorepo](../guias/typescript-en-el-monorepo.md).

---

## Flujo de alto nivel

```mermaid
flowchart TB
  subgraph dev ["Mantenedor"]
    SRC[src/lib + main.ts]
    ROLL[rollup build]
    SRC --> ROLL
    ROLL --> DIST[dist/*.js]
  end
  subgraph app ["App Ryunix"]
    RYX[app/*.ryx]
    PRE[@unsetsoft/ryunix-presets]
    RYX --> PRE
  end
  subgraph browser ["Navegador"]
    CORE[@unsetsoft/ryunixjs]
    DOM[DOM actualizado]
    CORE --> DOM
  end
  DIST --> PRE
  PRE --> CORE
```

1. El preset compila páginas y resuelve `@unsetsoft/ryunixjs` en bundles cliente
   y servidor.
2. En el cliente, `render` / `hydrate` montan el árbol Fiber y el reconciliador
   aplica commits al DOM.
3. En SSR, `renderToString` / streaming usan `server.js` y APIs relacionadas.

---

## Documentación relacionada

| Documento                                                                         | Contenido                         |
| :-------------------------------------------------------------------------------- | :-------------------------------- |
| [vdom-y-reconciliacion.md](./vdom-y-reconciliacion.md)                            | Fiber, work loop, commit          |
| [hooks.md](./hooks.md)                                                            | Estado y efectos                  |
| [renderizado.md](./renderizado.md)                                                | Cliente, hidratación, SSR         |
| [funciones-servidor.md](./funciones-servidor.md)                                  | Server Actions, boundaries        |
| [ryunix-presets/resumen-del-paquete.md](../ryunix-presets/resumen-del-paquete.md) | Cómo se empaqueta el core en apps |
| `packages/core/README.md`                                                         | Introducción y API de alto nivel  |
