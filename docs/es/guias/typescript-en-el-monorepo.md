# TypeScript en el monorepo RyunixJS

> **Language / Idioma:** [English](../../en/guides/typescript-in-the-monorepo.md) ·
> [Español](./typescript-en-el-monorepo.md)

Referencia de **cómo está configurado TypeScript en este repositorio**:
config compartida, scripts, tipos publicados en npm y migración incremental del
código fuente para mantenedores. Complementa los README de paquetes y
[pila-tecnologica-y-scripts.md](./pila-tecnologica-y-scripts.md).

**Última revisión:** 2026-05-24

---

## Tabla de contenidos

- [TypeScript en el monorepo RyunixJS](#typescript-en-el-monorepo-ryunixjs)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Alcance](#alcance)
  - [Dos objetivos](#dos-objetivos)
  - [Fases de migración (mantenedores)](#fases-de-migración-mantenedores)
  - [Infraestructura compartida (raíz)](#infraestructura-compartida-raíz)
  - [Disposición por paquete](#disposición-por-paquete)
  - [Scripts](#scripts)
  - [CI y antes de un PR](#ci-y-antes-de-un-pr)
  - [TypeScript en apps Ryunix (usuarios finales)](#typescript-en-apps-ryunix-usuarios-finales)
  - [Documentación relacionada](#documentación-relacionada)

---

## Alcance

| Dentro | Fuera |
| :----- | :---- |
| Archivos `tsconfig`, `typecheck`, scripts de emit en `packages/` | Reescribir todo el core en `.ts` (en curso, por fases) |
| `.d.ts` publicados para `@unsetsoft/*` | Referencia API completa de cada hook (ver README de `core`) |
| `checkJs` + JSDoc en `packages/core` | Config TS detallada de apps de usuario más allá de pautas básicas |

Los bundles que se publican en npm siguen siendo **JavaScript** (Rollup/Webpack).
TypeScript se usa para **comprobación estática**, **soporte en el editor** y
**migración gradual del código fuente**.

---

## Dos objetivos

| Objetivo | Para quién | Qué implica aquí |
| :------- | :--------- | :--------------- |
| **A. Tipos para consumidores** | Apps con TS, `ryunix.config.js` tipado, imports `@unsetsoft/*` | `.d.ts` a mano, `"types"` en `package.json`, JSDoc en API pública |
| **B. Código fuente en TS** | Mantenedores del monorepo | Archivos `.ts`, emit con `tsc` donde haga falta, plugin TS en Rollup (core) |

El objetivo **A** está avanzado en presets y core. El **B** es **incremental**
(un módulo o carpeta cada vez).

---

## Fases de migración (mantenedores)

Plan interno (fases 0–7). Estado a 2026-05:

| Fase | Nombre | Estado | Entregable |
| :--: | :----- | :----- | :--------- |
| **0** | Infra compartida | Hecha | `tsconfig.base.json`, `tsconfig.json` por paquete, `pnpm run typecheck`, CI |
| **1** | Tipos presets (consumidores) | Hecha | `webpack/config.d.ts`, `RyunixUserConfig`, JSDoc en plantillas CRA |
| **2** | Tipos core (consumidores) | Hecha | `types/index.d.ts`, JSX runtime `.d.ts`, `"types"` en `@unsetsoft/ryunixjs` |
| **3** | `checkJs` + JSDoc (core) | Hecha (1.er lote) | `tsconfig.checkjs.json` sobre `src/utils/**` + `src/lib/**`, `internal.d.ts` |
| **4** | CRA en TS | Iniciada | `get-pkg-manager.ts` + `build:helpers` |
| **5** | DevTools en TS | Iniciada | `background.ts` + `build:background` |
| **6** | Presets en TS | Iniciada | `remark-github-alerts.ts` + `build:plugins` |
| **7** | Core en TS | Iniciada | `batching.ts` vía `@rollup/plugin-typescript` en Rollup |

**Orden para más `.ts` en core:** utilidades y API pública → hooks → componentes →
reconciliador / work loop (mayor riesgo al final).

---

## Infraestructura compartida (raíz)

### `tsconfig.base.json`

Opciones base para todos los paquetes:

- `allowJs: true`, `checkJs: false` (comprobación estricta por paquete o vía
  `tsconfig.checkjs.json`)
- `noEmit: true` en la base (los paquetes override al emitir JS)
- `strict: false` global — se endurece de forma incremental

Cada paquete extiende este archivo con su `tsconfig.json`.

### Turbo y scripts raíz

| Elemento | Ubicación | Función |
| :------- | :-------- | :------ |
| Tarea `typecheck` | `turbo.json` | Ejecuta `typecheck` en cada paquete que lo define |
| `pnpm run typecheck` | `package.json` raíz | Orquestación Turbo |
| CI | `.github/workflows/eslint.yml` | Ejecuta `npm run typecheck` tras ESLint |

### Dependencia

- `typescript` y `@types/node` son **devDependencies en la raíz** (versión
  compartida del workspace).

---

## Disposición por paquete

### `@unsetsoft/ryunixjs` (`packages/core`)

**Tipos para consumidores (objetivo A)**

| Archivo | Función |
| :------ | :------ |
| `types/index.d.ts` | Entrada principal: hooks, render, SSR, router, componentes, `export default` |
| `jsx/jsx-runtime.d.ts` | JSX automático (`jsx`, `jsxs`, `Fragment`, namespace `JSX`) |
| `jsx/jsx-dev-runtime.d.ts` | Reexporta runtime de desarrollo |
| `types/index.typetest.ts` | Smoke test en compile-time (no se ejecuta) |
| `package.json` → `"types"`, `exports["."].types`, tipos JSX | Resolución npm |

Ver también [packages/core/README.es.md](../../packages/core/README.es.md)
(sección TypeScript).

**Comprobación para mantenedores (objetivo B)**

| Archivo | Función |
| :------ | :------ |
| `tsconfig.json` | Incluye `src/**/*.js`, `src/**/*.ts`, `jsx/`, `types/` |
| `tsconfig.checkjs.json` | `checkJs: true`, `noImplicitAny: true` en `src/utils/**` y `src/lib/**` |
| `src/types/internal.d.ts` | Tipos internos fiber/hook/DOM (no publicados) |
| `src/lib/batching.ts` | Primer módulo de runtime en TypeScript |
| `rollup.config.js` | `@rollup/plugin-typescript` transpila `src/**/*.ts` a bundles |

**Scripts**

| Script | Comando |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` **y** `tsconfig.checkjs.json` |
| `typecheck:checkjs` | Solo pasada JSDoc/`checkJs` |
| `build` | Rollup (fuentes JS + TS) |

**Nota:** La mayor parte de `packages/core` sigue en `.js`. Rollup resuelve
`import './batching.js'` hacia `batching.ts` con el plugin TS y extensiones
`.ts`.

---

### `@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)

**Tipos para consumidores (objetivo A)**

| Archivo | Función |
| :------ | :------ |
| `webpack/config.d.ts` | `RyunixUserConfig` y tipos anidados de config |
| `webpack/config.typetest.ts` | Smoke test en compile-time |
| `package.json` → `"types"`, `exports["."].types` | Resolución npm |

Documentado en [carga-de-configuracion.md](../ryunix-presets/carga-de-configuracion.md)
y README del paquete.

**Código fuente mantenedor (objetivo B)**

| Archivo | Función |
| :------ | :------ |
| `webpack/plugins/remark-github-alerts.ts` | Fuente del plugin MDX de alertas GitHub |
| `webpack/plugins/remark-github-alerts.js` | ESM emitido (commiteado; regenerar con `build:plugins`) |
| `tsconfig.plugins.json` | Config de emit del plugin |

**Scripts**

| Script | Comando |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build:plugins` | `tsc -p tsconfig.plugins.json` |
| `test` | Tests del plugin remark |

Webpack importa `./plugins/remark-github-alerts.js` (ya no `.mjs`).

---

### `@unsetsoft/cra` (`packages/cra`)

**Código fuente (objetivo B — iniciado)**

| Archivo | Función |
| :------ | :------ |
| `src/helpers/get-pkg-manager.ts` | Helper tipado para npm/yarn/pnpm/bun |
| `src/helpers/get-pkg-manager.js` | Emit CommonJS para `require()` desde `create-app.js` |
| `tsconfig.emit.json` | Emite JS en `src/helpers/` |

CRA sigue mayormente en `.js` (CLI Commander, plantillas sin cambios).

**Scripts**

| Script | Comando |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build:helpers` | `tsc -p tsconfig.emit.json` |

Ejecuta `build:helpers` tras editar `get-pkg-manager.ts`.

---

### `@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)

**Código fuente (objetivo B — iniciado)**

| Archivo | Función |
| :------ | :------ |
| `background.ts` | Fuente del service worker |
| `background.js` | Script emitido referenciado por `manifest.json` |
| `chrome.d.ts` | Stubs mínimos de la API Chrome (sin dep `@types/chrome`) |
| `tsconfig.emit.json` | Emite `background.js` |

El resto de scripts de la extensión (`panel.js`, `hook.js`, …) siguen en JS.

**Scripts**

| Script | Comando |
| :----- | :------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build:background` | `tsc -p tsconfig.emit.json` |

Ejecuta `build:background` antes de recargar la extensión desempaquetada.

---

## Scripts

### Desde la raíz del repositorio

```bash
pnpm run typecheck          # todos los paquetes (Turbo)
pnpm --filter @unsetsoft/ryunixjs run typecheck:checkjs   # solo JSDoc del core
pnpm --filter @unsetsoft/cra run build:helpers
pnpm --filter @unsetsoft/ryunix-devtools run build:background
pnpm --filter @unsetsoft/ryunix-presets run build:plugins
```

### Flujo habitual del mantenedor

```text
1. pnpm install
2. Editar código (JS con JSDoc y/o .ts)
3. pnpm run typecheck                    ← obligatorio antes del PR
4. Si tocaste fuentes .ts emitidas:
   - cra:      pnpm --filter @unsetsoft/cra run build:helpers
   - devtools: pnpm --filter @unsetsoft/ryunix-devtools run build:background
   - presets:  pnpm --filter @unsetsoft/ryunix-presets run build:plugins
5. Si tocaste packages/core (sobre todo .ts o API pública):
   pnpm --filter @unsetsoft/ryunixjs run build
6. pnpm run test && pnpm run lint
```

---

## CI y antes de un PR

Los pull requests deben pasar:

- `pnpm run lint`
- `pnpm run test`
- **`pnpm run typecheck`**

El workflow de ESLint también ejecuta `typecheck`.

Al añadir **nuevos archivos `.ts`**:

1. Inclúyelos en el `tsconfig.json` del paquete (o config de emit).
2. Asegura que `typecheck` los cubre.
3. Si Node o Webpack consumen `.js` sin bundler, añade script de **emit** (patrón
   CRA / DevTools / plugin presets) o **Rollup** (patrón core).

---

## TypeScript en apps Ryunix (usuarios finales)

Este monorepo publica tipos; **las apps generadas** optan por TS por separado.

| Necesidad | Paquete / archivo |
| :-------- | :---------------- |
| `ryunix.config.js` tipado | `@unsetsoft/ryunix-presets` → `RyunixUserConfig` |
| Hooks, componentes, SSR | `@unsetsoft/ryunixjs` → `types/index.d.ts` |
| JSX automático | `"jsxImportSource": "@unsetsoft/ryunixjs"` en `tsconfig.json` de la app |

Ejemplo (`ryunix.config.js`):

```javascript
/** @type {import('@unsetsoft/ryunix-presets').RyunixUserConfig} */
export default {
  ssr: true,
  port: 3000,
}
```

Ejemplo (componente):

```typescript
import { useStore, createElement, type RyunixElement } from '@unsetsoft/ryunixjs'
```

---

## Documentación relacionada

| Tema | Documento |
| :--- | :-------- |
| Scripts y pila | [pila-tecnologica-y-scripts.md](./pila-tecnologica-y-scripts.md) |
| Tipos de config presets | [carga-de-configuracion.md](../ryunix-presets/carga-de-configuracion.md) |
| README core | [packages/core/README.es.md](../../packages/core/README.es.md) |
| README presets | [packages/ryunix-presets/README.es.md](../../packages/ryunix-presets/README.es.md) |
| Contribución | [CONTRIBUTING.es.md](../../CONTRIBUTING.es.md) |
| Índice | [resumen.md](../resumen.md) |
