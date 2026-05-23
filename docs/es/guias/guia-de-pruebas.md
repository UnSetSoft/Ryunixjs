# Guía de pruebas del monorepo RyunixJS

> **Language / Idioma:** [English](../../en/guides/testing-guide.md) ·
> [Español](./guia-de-pruebas.md)

Describe cómo verificar cambios en el framework: tests automatizados,
comprobaciones manuales por paquete y la app de integración local.

> **Desarrollo en navegador:** la raíz del monorepo no expone una app web con
> `pnpm dev`. El equivalente a `pnpm dev` en una app Ryunix es
> **`pnpm run:web`**, que ejecuta `ryunix dev` sobre `test/webpack`. Ver
> [Desarrollo local](./guia-del-repositorio.md#desarrollo-local-el-equivalente-a-pnpm-dev)
> en la guía del repositorio.

---

## Índice

- [Guía de pruebas del monorepo RyunixJS](#guía-de-pruebas-del-monorepo-ryunixjs)
  - [Índice](#índice)
  - [Resumen rápido](#resumen-rápido)
  - [Desarrollo local sin npm: deps enlazadas](#desarrollo-local-sin-npm-deps-enlazadas)
  - [Requisitos](#requisitos)
  - [Flujo de desarrollo](#flujo-de-desarrollo)
  - [Comandos globales (desde la raíz)](#comandos-globales-desde-la-raíz)
  - [`@unsetsoft/ryunixjs` (`packages/core`)](#unsetsoftryunixjs-packagescore)
  - [`@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)](#unsetsoftryunix-presets-packagesryunix-presets)
  - [`@unsetsoft/cra` (`packages/cra`)](#unsetsoftcra-packagescra)
  - [`@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)](#unsetsoftryunix-devtools-packagesryunix-devtools)
  - [App de integración local (`test/webpack`)](#app-de-integración-local-testwebpack)
  - [Matriz de herramientas por ámbito](#matriz-de-herramientas-por-ámbito)
  - [Documentación relacionada](#documentación-relacionada)

---

## Resumen rápido

| Paquete                      | Ruta                       | Tests automatizados            | Cómo probar cambios                         |
| :--------------------------- | :------------------------- | :----------------------------- | :------------------------------------------ |
| `@unsetsoft/ryunixjs`        | `packages/core`            | **Sí** (Jest + jsdom)          | `pnpm --filter @unsetsoft/ryunixjs test`    |
| `@unsetsoft/ryunix-presets`  | `packages/ryunix-presets`  | No                             | App local `test/webpack` + `pnpm run:web`   |
| `@unsetsoft/cra`             | `packages/cra`             | No                             | Ejecutar el CLI contra una carpeta temporal |
| `@unsetsoft/ryunix-devtools` | `packages/ryunix-devtools` | No                             | Cargar extensión en Chrome + app Ryunix     |
| **Monorepo (raíz)**          | `/`                        | Turbo orquesta `test` del core | `pnpm test`, `pnpm lint`, `pnpm build`      |

La carpeta `test/` está en `.gitignore` y no se versiona en Git. Cada clon del
repositorio debe crear una app de integración local (ver
[App de integración local](#app-de-integración-local-testwebpack)).

---

## Desarrollo local sin npm: deps enlazadas

**Linkear deps locales** significa que la app de integración resuelve
`@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` desde `packages/core` y
`packages/ryunix-presets`, no desde el registry npm.

En este monorepo no es necesario ejecutar `pnpm link` manualmente. pnpm
workspaces resuelve el enlace con el protocolo `workspace:*` en el
`package.json` de la app:

```json
{
  "dependencies": {
    "@unsetsoft/ryunixjs": "workspace:*"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "workspace:*"
  }
}
```

Tras `pnpm install`, `node_modules` no contiene una copia del registry: contiene
un **symlink** al paquete local:

```text
test/webpack/node_modules/@unsetsoft/ryunixjs
        │
        └── symlink → packages/core/
```

El `package.json` raíz define `pnpm.overrides` con versiones `workspace:*` en
todo el monorepo, evitando resolución accidental hacia npm publicado.

|                           | npm / registry                  | deps locales (`workspace:*`)           |
| :------------------------ | :------------------------------ | :------------------------------------- |
| Origen                    | registry npm                    | carpetas `packages/*` del repo         |
| Cambio en `packages/core` | no se refleja                   | sí, tras `build` + recarga             |
| Dependencia típica        | `"@unsetsoft/ryunixjs": "^1.x"` | `"@unsetsoft/ryunixjs": "workspace:*"` |
| Enlace manual             | no aplica                       | no requerido (`pnpm link`)             |

### Estructura del monorepo

```text
Ryunixjs/  (raíz — no es una app Ryunix)
├── packages/core              → motor UI
├── packages/ryunix-presets    → CLI ryunix + Webpack
├── packages/cra               → generador de apps
├── packages/ryunix-devtools   → extensión Chrome
└── test/webpack               → app de integración local (gitignored)
         │
         └── workspace:* → código local, no npm
```

> **Nota:** `pnpm dev` en la raíz no abre el framework en el navegador;
> actualmente solo ejecuta el CLI interactivo de CRA. Para ejecutar el framework
> en el navegador: **`pnpm run:web`**.

---

## Requisitos

- **Node.js**: 20, 22 o 24 (recomendado >= 22; ver `CONTRIBUTING.md`).
- **pnpm**: v10+ (`packageManager` en la raíz).
- Tras clonar el repositorio: `pnpm install` en la raíz del monorepo.

---

## Flujo de desarrollo

### Configuración inicial

```bash
pnpm install

# Crear test/webpack (ver «App de integración local»)

pnpm build
pnpm run:web
```

### Ciclo habitual

```text

1. Cambios en test/webpack/app/     → HMR recarga la app al guardar
2. Cambios en packages/core          → pnpm --filter @unsetsoft/ryunixjs build → recargar navegador
3. Cambios en packages/ryunix-presets → reiniciar pnpm run:web
4. Cambios en packages/ryunix-devtools → recargar extensión en chrome://extensions/
5. Cambios listos en packages/*      → commit y PR (solo framework; test/ queda fuera de git)
```

El monorepo sigue el mismo patrón que otros frameworks con app de ejemplo local:
`test/webpack` cumple ese rol frente a `packages/*`.

---

## Comandos globales (desde la raíz)

| Comando              | Qué hace                                                                                                  |
| :------------------- | :-------------------------------------------------------------------------------------------------------- |
| `pnpm install`       | Instala dependencias de todos los workspaces.                                                             |
| `pnpm build`         | Compila paquetes (Turbo; `build` depende de `^build`).                                                    |
| `pnpm test`          | Ejecuta `test` en paquetes que lo definan (hoy: solo **core**). Turbo exige `build` antes (`turbo.json`). |
| `pnpm lint`          | ESLint en la raíz + `lint` por paquete vía Turbo.                                                         |
| `pnpm lint:fix`      | Corrige lint y formatea con Prettier.                                                                     |
| `pnpm run:web`       | `ryunix dev` en `test/webpack` (requiere app local).                                                      |
| `pnpm run:web:build` | `ryunix build` en la app de prueba.                                                                       |
| `pnpm run:web:start` | `ryunix start` (producción) en la app de prueba.                                                          |

### Antes de abrir un PR

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

El workflow de GitHub (`.github/workflows/eslint.yml`) ejecuta **lint**, no la
suite Jest. Los tests del core deben pasar en local hasta que CI los incorpore.

---

## `@unsetsoft/ryunixjs` (`packages/core`)

Motor de UI: reconciliador, hooks, render. Es el **único paquete con tests
unitarios** en el monorepo.

### Stack

- **Jest** 30 + **babel-jest** + **jest-environment-jsdom**
- Config: `packages/core/jest.config.cjs`
- Setup global: `packages/core/jest.setup.js` (polyfills de

  `requestIdleCallback` / `cancelIdleCallback`)

- Tests: `packages/core/src/tests/**/*.test.js`
- Babel: `packages/core/babel.config.json`

### Ejecutar solo el core

```bash

# Desde la raíz (recomendado)

pnpm --filter @unsetsoft/ryunixjs test

# Desde el paquete

cd packages/core && pnpm test
```

Modo watch (desarrollo):

```bash
cd packages/core
pnpm exec jest --testPathPattern=src --watch
```

### Escribir un test nuevo

1. Crear `packages/core/src/tests/<nombre>.test.js`.
2. Importar desde `../lib/...` (código fuente, no `dist/`).
3. Usar `workLoop({ timeRemaining: () => 100 })` tras acciones que disparen

   actualizaciones asíncronas del reconciliador.

4. Montar en un contenedor con `Ryunix.init()` y un `div` en `document.body`

   (ver test de referencia).

Ejemplo existente: `packages/core/src/tests/TestComponent.test.js` (hook
`useStore` y actualización del DOM).

### Limitaciones actuales

- No hay tests de integración SSR/SSG en el core; eso se valida con la app

  `test/webpack`.

- Jest requiere dependencias instaladas (`pnpm install` en la raíz). Error

  `jest: orden no encontrada`: reinstalar dependencias.

---

## `@unsetsoft/ryunix-presets` (`packages/ryunix-presets`)

CLI `ryunix`, Webpack dual, routing, SSG y APIs. **No define script `test`** ni
suite Jest.

### Cómo probar

1. **Compilar el core** (el preset declara peer dependency sobre

   `@unsetsoft/ryunixjs`):

   ```bash
   pnpm --filter @unsetsoft/ryunixjs build
   ```

1. Usar la **app de integración** local (`test/webpack`) enlazada al workspace

   (sección siguiente).

1. Probar comandos manualmente dentro de esa app:

   ```bash
   pnpm run:web          # ryunix dev — HMR, SSR en desarrollo
   pnpm run:web:build    # ryunix build — SSG, bundles
   pnpm run:web:start    # ryunix start — servidor de producción
   ```

1. Para depurar solo el CLI sin scripts de la raíz:

   ```bash
   cd test/webpack
   pnpm exec ryunix dev
   ```

### Qué validar a mano

| Área              | Comprobación sugerida                                  |
| :---------------- | :----------------------------------------------------- |
| Routing           | Rutas bajo `app/`, layouts, `errors.ryx`               |
| Build             | `ryunix build` sin errores; artefactos en `.ryunix/`   |
| SSR / hidratación | Vista en navegador sin errores de hidratación          |
| API               | `app/api/**/router.js` en dev y tras `build` + `start` |
| MDX / loaders     | Páginas `.mdx` añadidas a la app de prueba             |

Documentación técnica: [CLI y arranque](./ryunix-presets/cli-y-arranque.md),
[Enrutamiento y SSG](./ryunix-presets/enrutamiento-y-ssg.md).

---

## `@unsetsoft/cra` (`packages/cra`)

Scaffolder `npx @unsetsoft/cra`. **Sin tests automatizados.**

### Ejecutar el CLI desde el monorepo

```bash

# Modo interactivo (script dev del paquete)

pnpm --filter @unsetsoft/cra dev

# O directamente con Node

node packages/cra/src/cli.js ../_cra/mi-app-prueba --latest
```

Para pruebas del CLI sin mezclar con la app webpack, usar una carpeta fuera de
`test/` (p. ej. `_cra/`, también en `.gitignore`).

### Qué validar

| Paso           | Comprobación                                                               |
| :------------- | :------------------------------------------------------------------------- |
| Generación     | Plantilla copiada (`ryunix-base`, `--tailwind`, `--eslint`, etc.)          |
| `package.json` | Dependencias `@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` resueltas |
| Instalación    | El asistente ejecuta el gestor de paquetes elegido sin error               |
| App generada   | `npm run dev` / `pnpm dev` arranca con `ryunix dev`                        |

Opciones útiles: `--canary`, `--tailwind`, `--eslint`, `--compiler swc|babel`.

Documentación: [CLI y ayudantes](./cra/cli-y-ayudantes.md),
[Generación de plantillas](./cra/generacion-de-plantillas.md).

---

## `@unsetsoft/ryunix-devtools` (`packages/ryunix-devtools`)

Extensión de navegador (Manifest V3). **Sin tests automatizados** en el
monorepo.

### Instalación para pruebas

1. Compilar o servir una app Ryunix (`pnpm run:web` o app generada con CRA).
2. En Chrome: `chrome://extensions/` → **Modo de desarrollador** → \*\*Cargar

   extensión sin empaquetar\*\*.

3. Seleccionar la carpeta `packages/ryunix-devtools`.

### Qué validar (CRA)

- Pestaña **Ryunix** en DevTools (F12).
- Árbol de componentes, props y detección de la app.
- Tras modificar archivos de la extensión: **Recargar** en

  `chrome://extensions/`.

Más detalle: `packages/ryunix-devtools/README.md`.

---

## App de integración local (`test/webpack`)

No está en el repositorio (`.gitignore`). Los scripts `pnpm run:web*` asumen un
paquete en `test/webpack/package.json` incluido en el workspace
(`pnpm-workspace.yaml`).

### Ubicación de la app de integración

|                         | `test/webpack` (dentro del repo)                    | Carpeta externa (fuera del repo)                       |
| :---------------------- | :-------------------------------------------------- | :----------------------------------------------------- |
| Enlace al framework     | Automático vía `workspace:*`                        | Manual: `file:../Ryunixjs/packages/core` o `pnpm link` |
| Scripts `pnpm run:web*` | Disponibles desde la raíz                           | No; ejecutar `pnpm dev` dentro de la carpeta externa   |
| Git / commits           | `test/` en `.gitignore`; la app no entra en commits | Repositorio aparte o sin control de versiones          |
| Caso de uso             | Desarrollo y contribución al framework              | App de largo plazo con historial git independiente     |

**Ubicación recomendada:** `test/webpack` dentro del monorepo. Es el flujo
documentado; los scripts de la raíz están configurados para esa ruta y el
contenido de prueba queda excluido de git.

Apps generadas con CRA **fuera** de `test/` (p. ej. `_cra/mi-app`, gitignored)
requieren dependencias apuntadas al monorepo manualmente:

```json
{
  "dependencies": {
    "@unsetsoft/ryunixjs": "file:../Ryunixjs/packages/core"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "file:../Ryunixjs/packages/ryunix-presets"
  }
}
```

Cada cambio en el framework requiere `build` en el monorepo y reinicio o recarga
de la app externa.

### Git y alcance de los commits

El repositorio separa dos capas:

```text
┌─────────────────────────────────────┐
│  Framework (packages/, docs/)       │  → versionado: commits, PRs, rama canary
├─────────────────────────────────────┤
│  App de prueba (test/webpack)       │  → excluido: gitignored, solo local
└─────────────────────────────────────┘
```

| Ámbito del cambio                        | ¿Aparece en `git status`? | Acción                     |
| :--------------------------------------- | :------------------------ | :------------------------- |
| `packages/core`, presets, CRA, devtools  | **Sí**                    | Commit y PR hacia `canary` |
| `test/webpack/app/*.ryx`, rutas, estilos | **No**                    | Solo entorno local         |
| `docs/`                                  | **Sí**                    | Commit normal              |

La carpeta `test/` completa está en `.gitignore`. Rutas, APIs y componentes de
prueba no forman parte del historial de git. Solo se versionan cambios del
framework en `packages/` y documentación en `docs/`.

### Crear la app (una vez)

### Opción A — CRA dentro del monorepo

```bash
mkdir -p test
node packages/cra/src/cli.js test/webpack-app --latest

# Renombrar o mover a test/webpack; o crear test/webpack manualmente

```

Tras generar con CRA, sustituir en `test/webpack/package.json` las versiones de
npm por `workspace:*` (como en la opción B).

### Opción B — Copiar plantilla y enlazar workspace (recomendada)

1. Copiar la plantilla base:

   ```bash
   mkdir -p test
   cp -r packages/cra/templates/ryunix-base test/webpack
   cp packages/cra/templates/ryunix-base/gitignore test/webpack/.gitignore
   ```

1. Editar `test/webpack/package.json`:

```json
{
  "name": "ryunix-webpack-test",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "ryunix dev",
    "build": "ryunix build",
    "start": "ryunix start"
  },
  "dependencies": {
    "@unsetsoft/ryunixjs": "workspace:*"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "workspace:*"
  },
  "engines": {
    "node": "^20 || ^22 || ^24"
  }
}
```

1. Desde la **raíz** del monorepo:

```bash
pnpm install
pnpm build
pnpm run:web
```

Los `overrides` de pnpm en la raíz (`package.json` → `pnpm.overrides`) fuerzan
que la app use los paquetes del workspace, no versiones de npm publicadas.

### Verificación del enlace local

Tras `pnpm install`, el symlink debe apuntar al monorepo:

```bash
ls -la test/webpack/node_modules/@unsetsoft/ryunixjs

# Symlink hacia packages/core

```

En `test/webpack/package.json` deben figurar `"workspace:*"`, no versiones del
registry npm.

### Estructura de la app

La app en `test/webpack/` sigue las convenciones Ryunix (no Next.js):

```text
test/webpack/
├── app/
│   ├── index.ryx              ← página principal (/)
│   ├── layout.ryx             ← layout global
│   ├── errors.ryx             ← manejo de errores
│   ├── about/index.ryx        ← ruta /about
│   └── api/hello/router.js    ← API /api/hello
├── styles/global.css
├── assets/
├── ryunix.config.js           ← configuración del framework
└── package.json               ← workspace:* al core y presets
```

Ejemplo de página (`app/index.ryx`):

```jsx
export const Metatags = {
  title: 'App de integración local',
}

export default function Index() {
  return (
    <main>
      <h1>Ryunix — entorno local</h1>
    </main>
  )
}
```

**Routing:** carpetas bajo `app/` definen rutas (p. ej. `app/about/index.ryx` →
`/about`). El plugin de Webpack genera el router en compile time.

**Colocación de componentes:** componentes usados en una sola ruta se colocan
junto a esa ruta o en un subfolder de `app/`. Una carpeta compartida solo cuando
existe un segundo consumidor.

### Flujo según el ámbito del cambio

| Ámbito del cambio          | Pasos                                                          |
| :------------------------- | :------------------------------------------------------------- |
| `test/webpack/app/*.ryx`   | Guardar → HMR recarga                                          |
| `packages/core`            | `pnpm --filter @unsetsoft/ryunixjs build` → recargar navegador |
| `packages/ryunix-presets`  | Reiniciar `pnpm run:web`                                       |
| `packages/ryunix-devtools` | Recargar extensión en `chrome://extensions/`                   |
| Plantillas CRA             | Regenerar app de prueba o copiar archivos manualmente          |

Comandos de producción desde la raíz:

```bash
pnpm run:web:build    # ryunix build — SSG, bundles en .ryunix/
pnpm run:web:start    # ryunix start — servidor de producción
```

---

## Matriz de herramientas por ámbito

| Ámbito                     | Herramientas                                                   |
| :------------------------- | :------------------------------------------------------------- |
| Hooks, reconciler, render  | Jest en `packages/core` + `build` + `run:web`                  |
| Webpack, CLI, routing, SSG | `run:web` (`test/webpack`) + `lint`                            |
| Plantillas o CLI de CRA    | `node packages/cra/src/cli.js <dir>` + `dev` en app generada   |
| Extensión DevTools         | Cargar `packages/ryunix-devtools` + app Ryunix en el navegador |

---

## Documentación relacionada

| Tema                 | Enlace                                               |
| :------------------- | :--------------------------------------------------- |
| Guía del repositorio | [guia-del-repositorio.md](./guia-del-repositorio.md) |
| Contribución         | [CONTRIBUTING.es.md](../../CONTRIBUTING.es.md)       |
| Índice docs          | [resumen.md](./resumen.md)                           |
