# TypeScript en el monorepo RyunixJS

> **Language / Idioma:** [English](../../en/guides/typescript-in-the-monorepo.md)
> · [Español](./typescript-en-el-monorepo.md)

Referencia de **cómo está configurado TypeScript en este repositorio**:
config compartida, scripts, tipos publicados en npm y el código fuente en
TypeScript para mantenedores. Complementa los README de paquetes y
[pila-tecnologica-y-scripts.md](./pila-tecnologica-y-scripts.md).

**Última revisión:** 2026-05-24

---

## Tabla de contenidos

- [TypeScript en el monorepo RyunixJS](#typescript-en-el-monorepo-ryunixjs)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Alcance](#alcance)
  - [Dos objetivos](#dos-objetivos)
  - [Fases de migración (mantenedores)](#fases-de-migración-mantenedores)
  - [Qué sigue en JavaScript](#qué-sigue-en-javascript)
  - [Infraestructura compartida (raíz)](#infraestructura-compartida-raíz)
  - [Disposición por paquete](#disposición-por-paquete)
  - [Scripts](#scripts)
  - [CI y antes de un PR](#ci-y-antes-de-un-pr)
  - [TypeScript en apps Ryunix (usuarios finales)](#typescript-en-apps-ryunix-usuarios-finales)
  - [Documentación relacionada](#documentación-relacionada)

---

## Alcance

| Dentro                                                           | Fuera                                                             |
| :--------------------------------------------------------------- | :---------------------------------------------------------------- |
| Archivos `tsconfig`, `typecheck`, scripts de emit en `packages/` | Referencia API completa de cada hook (ver README de `core`)       |
| `.d.ts` publicados para `@unsetsoft/*`                           | Config TS detallada de apps de usuario más allá de pautas básicas |
| Código fuente del runtime, CLI, presets y DevTools en `.ts`      | Plantillas CRA y apps generadas (siguen en JS / `.ryx`)           |

Los bundles que se publican en npm siguen siendo **JavaScript** (Rollup/Webpack).
TypeScript se usa para **comprobación estática**, **soporte en el editor** y
**autoría del código fuente** en los paquetes del monorepo.

---

## Dos objetivos

| Objetivo                       | Para quién                                                     | Qué implica aquí                                                                |
| :----------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **A. Tipos para consumidores** | Apps con TS, `ryunix.config.js` tipado, imports `@unsetsoft/*` | `.d.ts` a mano, `"types"` en `package.json`, JSDoc en API pública               |
| **B. Código fuente en TS**     | Mantenedores del monorepo                                      | Archivos `.ts`, emit con `tsc` donde haga falta, Rollup sobre JS emitido (core) |

Ambos objetivos están **completados** en los cuatro paquetes publicados
(`core`, `presets`, `cra`, `devtools`). Lo que queda en `.js` es intencional
(JSX runtime, tests, `.cjs` legacy o plantillas de usuario).

---

## Fases de migración (mantenedores)

Plan interno (fases 0–7). Estado a 2026-05-24:

| Fase  | Nombre                       | Estado | Entregable                                                                        |
| :---: | :--------------------------- | :----- | :-------------------------------------------------------------------------------- |
| **0** | Infra compartida             | Hecha  | `tsconfig.base.json`, `tsconfig.json` por paquete, `pnpm run typecheck`, CI       |
| **1** | Tipos presets (consumidores) | Hecha  | `webpack/config.d.ts`, `RyunixUserConfig`, JSDoc en plantillas CRA                |
| **2** | Tipos core (consumidores)    | Hecha  | `types/index.d.ts`, JSX runtime `.d.ts`, `"types"` en `@unsetsoft/ryunixjs`       |
| **3** | `checkJs` + JSDoc (core)     | Hecha  | `tsconfig.checkjs.json` sobre `jsx/**/*.js` (runtime JSX)                         |
| **4** | CRA en TS                    | Hecha  | Todo `src/` en `.ts`; `build` emite `.js` en `src/`                               |
| **5** | DevTools en TS               | Hecha  | Todos los scripts de extensión en `.ts`; `build` emite `.js`                      |
| **6** | Presets en TS                | Hecha  | Todo `webpack/**/*.ts`; `build` emite `.js` junto a la fuente                     |
| **7** | Core en TS                   | Hecha  | `src/lib/**`, `src/utils/**`, `src/main.ts`; `build:lib-ts` emite `.js` en `src/` |

---

## Qué sigue en JavaScript

| Ubicación                                                               | Motivo                                                                   |
| :---------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `packages/core/jsx/**/*.js`                                             | Runtime JSX publicado; comprobación opcional con `typecheck:checkjs`     |
| `packages/core/src/tests/**`                                            | Tests Jest en JS                                                         |
| `packages/ryunix-presets/webpack/*.cjs`                                 | Config legacy CommonJS (`config.cjs`, `settingfile.cjs`, `envExist.cjs`) |
| `packages/ryunix-presets/webpack/plugins/remark-github-alerts.test.mjs` | Test Node del plugin remark                                              |
| `packages/cra/templates/**`                                             | Apps generadas para usuarios finales                                     |
| Raíz `eslint.config.mjs`                                                | Config ESLint del workspace                                              |

Los `.js` emitidos por `tsc` en `core`, `presets`, `cra` y `devtools` **sí se
commitean**; Node y Webpack los consumen directamente.

---

## Infraestructura compartida (raíz)

### `tsconfig.base.json`

Opciones base para todos los paquetes:

- `allowJs: true`, `checkJs: false` (comprobación estricta por paquete o vía
  configs dedicadas como `tsconfig.checkjs.json`)
- `noEmit: true` en la base (los paquetes override al emitir JS)
- `strict: false` global — se endurece de forma incremental

Cada paquete extiende este archivo con su `tsconfig.json`.

### Turbo y scripts raíz

| Elemento             | Ubicación                      | Función                                           |
| :------------------- | :----------------------------- | :------------------------------------------------ |
| Tarea `typecheck`    | `turbo.json`                   | Ejecuta `typecheck` en cada paquete que lo define |
| `pnpm run typecheck` | `package.json` raíz            | Orquestación Turbo                                |
| CI                   | `.github/workflows/eslint.yml` | Ejecuta `npm run typecheck` tras ESLint           |

### Dependencia

- `typescript` y `@types/node` son **devDependencies en la raíz** (versión
  compartida del workspace).

---

## Disposición por paquete

### `@unsetsoft/ryunixjs` (`packages/core`)

#### Tipos para consumidores (objetivo A)

| Archivo                                                     | Función                                                                      |
| :---------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `types/index.d.ts`                                          | Entrada principal: hooks, render, SSR, router, componentes, `export default` |
| `jsx/jsx-runtime.d.ts`                                      | JSX automático (`jsx`, `jsxs`, `Fragment`, namespace `JSX`)                  |
| `jsx/jsx-dev-runtime.d.ts`                                  | Reexporta runtime de desarrollo                                              |
| `types/index.typetest.ts`                                   | Smoke test en compile-time (no se ejecuta)                                   |
| `package.json` → `"types"`, `exports["."].types`, tipos JSX | Resolución npm                                                               |

Ver también [packages/core/README.es.md](../../packages/core/README.es.md)
(sección TypeScript).

#### Código fuente mantenedor (objetivo B)

| Archivo                            | Función                                                   |
| :--------------------------------- | :-------------------------------------------------------- |
| `src/lib/**/*.ts`                  | Runtime completo (hooks, reconciler, DOM, SSR, …)         |
| `src/utils/**/*.ts`, `src/main.ts` | Utilidades y entrada Rollup                               |
| `src/types/internal.d.ts`          | Tipos internos fiber/hook/DOM (no publicados)             |
| `tsconfig.json`                    | Typecheck: `src/**/*.ts`, `jsx/**/*.js`, `types/`         |
| `tsconfig.emit.json`               | Emite `.js` en `src/` (misma carpeta que la fuente `.ts`) |
| `tsconfig.checkjs.json`            | Comprobación opcional del runtime JSX (`jsx/**/*.js`)     |
| `rollup.config.js`                 | Bundle desde `src/main.js` (emitido) hacia `dist/`        |

#### Scripts

| Script              | Comando                                                    |
| :------------------ | :--------------------------------------------------------- |
| `typecheck`         | `tsc --noEmit -p tsconfig.json`                            |
| `typecheck:checkjs` | `tsc --noEmit -p tsconfig.checkjs.json` (solo JSX runtime) |
| `build:lib-ts`      | `tsc -p tsconfig.emit.json` — regenera `.js` en `src/`     |
| `build`             | Rollup → artefactos en `dist/`                             |
| `prepublishOnly`    | `build:lib-ts` + `build`                                   |

Tras editar cualquier `.ts` bajo `src/lib/`, `src/utils/` o `src/main.ts`,
ejecuta `build:lib-ts` antes de probar Rollup o la app de integración local.

---

### `@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)

#### Tipos para consumidores (objetivo A)

| Archivo                                          | Función                                       |
| :----------------------------------------------- | :-------------------------------------------- |
| `webpack/config.d.ts`                            | `RyunixUserConfig` y tipos anidados de config |
| `webpack/config.typetest.ts`                     | Smoke test en compile-time                    |
| `package.json` → `"types"`, `exports["."].types` | Resolución npm                                |

Documentado en [carga-de-configuracion.md](../ryunix-presets/carga-de-configuracion.md)
y README del paquete.

#### Código fuente mantenedor (objetivo B)

| Archivo                            | Función                                                  |
| :--------------------------------- | :------------------------------------------------------- |
| `webpack/**/*.ts`                  | Webpack config, CLI (`bin/`), loaders, plugins, utils    |
| `webpack/types/presets-shims.d.ts` | Stubs para módulos sin tipos                             |
| `webpack/utils/config.cjs.d.ts`    | Tipos del config legacy CJS                              |
| `tsconfig.emit.json`               | Emite `.js` ESM en `webpack/` (misma ruta que la fuente) |

Los imports en el código fuente usan extensión **`.js`** (resolución ESM hacia
el artefacto emitido). El binario publicado es `webpack/bin/index.js`.

#### Scripts

| Script           | Comando                                                   |
| :--------------- | :-------------------------------------------------------- |
| `typecheck`      | `tsc --noEmit -p tsconfig.json`                           |
| `build`          | `tsc -p tsconfig.emit.json`                               |
| `test`           | Tests del plugin remark (`remark-github-alerts.test.mjs`) |
| `prepublishOnly` | `build`                                                   |

---

### `@unsetsoft/cra` (`packages/cra`)

#### Código fuente (objetivo B — hecho)

| Aspecto    | Detalle                                                                       |
| :--------- | :---------------------------------------------------------------------------- |
| Fuente     | `src/**/*.ts` (`cli.ts`, `create-app.ts`, `helpers/*`)                        |
| Emit       | `tsconfig.emit.json` → `.js` CommonJS en `src/` (incluye `cli.js` para `bin`) |
| Plantillas | `templates/` siguen en JS / `.ryx` (apps generadas, no el paquete CRA)        |

#### Scripts

| Script      | Comando                         |
| :---------- | :------------------------------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build`     | `tsc -p tsconfig.emit.json`     |

Documentación del paquete: [docs/es/cra/resumen-del-paquete.md](../cra/resumen-del-paquete.md).
Ejecuta `build` tras editar cualquier `.ts` en `src/` antes de probar `node src/cli.js`.

---

### `@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)

#### Código fuente (objetivo B — hecho)

| Archivo                                                                    | Función                                                      |
| :------------------------------------------------------------------------- | :----------------------------------------------------------- |
| `background.ts`, `content-script.ts`, `devtools.ts`, `hook.ts`, `panel.ts` | Fuentes de la extensión                                      |
| `*.js` emitidos                                                            | Referenciados por `manifest.json` y el flujo de la extensión |
| `chrome.d.ts`, `window.d.ts`                                               | Stubs mínimos (sin dep `@types/chrome`)                      |
| `tsconfig.emit.json`                                                       | Emite todos los scripts `.js` en la raíz del paquete         |

#### Scripts

| Script      | Comando                         |
| :---------- | :------------------------------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build`     | `tsc -p tsconfig.emit.json`     |

Ejecuta `build` antes de recargar la extensión desempaquetada en Chrome.

---

## Scripts

### Desde la raíz del repositorio

```bash
pnpm run typecheck          # todos los paquetes (Turbo)
pnpm --filter @unsetsoft/ryunixjs run typecheck:checkjs   # solo JSX runtime
pnpm --filter @unsetsoft/cra run build
pnpm --filter @unsetsoft/ryunix-devtools run build
pnpm --filter @unsetsoft/ryunix-presets run build
pnpm --filter @unsetsoft/ryunixjs run build:lib-ts        # tras editar runtime .ts
```

### Flujo habitual del mantenedor

```text
1. pnpm install
2. Editar código (.ts en paquetes; jsx/**/*.js en core si aplica)
3. pnpm run typecheck                    ← obligatorio antes del PR
4. Si tocaste fuentes .ts emitidas:
   - core:     pnpm --filter @unsetsoft/ryunixjs run build:lib-ts
   - cra:      pnpm --filter @unsetsoft/cra run build
   - devtools: pnpm --filter @unsetsoft/ryunix-devtools run build
   - presets:  pnpm --filter @unsetsoft/ryunix-presets run build
5. Si tocaste packages/core y necesitas dist/ o publicar:
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
3. Si Node o Webpack consumen `.js` sin bundler, añade script de **emit**
   (patrón CRA / DevTools / presets) o **emit + Rollup** (patrón core).

---

## TypeScript en apps Ryunix (usuarios finales)

Este monorepo publica tipos; **las apps generadas** optan por TS por separado.

| Necesidad                 | Paquete / archivo                                                       |
| :------------------------ | :---------------------------------------------------------------------- |
| `ryunix.config.js` tipado | `@unsetsoft/ryunix-presets` → `RyunixUserConfig`                        |
| Hooks, componentes, SSR   | `@unsetsoft/ryunixjs` → `types/index.d.ts`                              |
| JSX automático            | `"jsxImportSource": "@unsetsoft/ryunixjs"` en `tsconfig.json` de la app |

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
import {
  useStore,
  createElement,
  type RyunixElement,
} from '@unsetsoft/ryunixjs'
```

---

## Documentación relacionada

| Tema                    | Documento                                                                          |
| :---------------------- | :--------------------------------------------------------------------------------- |
| Scripts y pila          | [pila-tecnologica-y-scripts.md](./pila-tecnologica-y-scripts.md)                   |
| Tipos de config presets | [carga-de-configuracion.md](../ryunix-presets/carga-de-configuracion.md)           |
| README core             | [packages/core/README.es.md](../../packages/core/README.es.md)                     |
| README presets          | [packages/ryunix-presets/README.es.md](../../packages/ryunix-presets/README.es.md) |
| Contribución            | [CONTRIBUTING.es.md](../../CONTRIBUTING.es.md)                                     |
| Índice                  | [resumen.md](../resumen.md)                                                        |
