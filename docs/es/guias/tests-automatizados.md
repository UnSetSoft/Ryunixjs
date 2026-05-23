# Tests automatizados y calidad del código

> **Language / Idioma:** [English](../../en/guides/automated-testing.md) ·
> [Español](./tests-automatizados.md)

Verificación en **CI y terminal** (Jest, lint, build) sin abrir una aplicación
Ryunix completa. Para ver cambios en el navegador con una app real enlazada al
monorepo, usar la guía aparte:
[app de integración local](./app-de-integracion-local.md).

| Vía | Guía |
| :-- | :--- |
| Tests automatizados (este documento) | Jest en `packages/core`, `pnpm test`, `pnpm lint` |
| App de integración local | [app-de-integracion-local.md](./app-de-integracion-local.md) |

---

## Índice

- [Tests automatizados y calidad del código](#tests-automatizados-y-calidad-del-código)
  - [Índice](#índice)
  - [Resumen por paquete](#resumen-por-paquete)
  - [Requisitos](#requisitos)
  - [Comandos globales](#comandos-globales)
  - [Antes de abrir un PR](#antes-de-abrir-un-pr)
  - [`@unsetsoft/ryunixjs` (`packages/core`)](#unsetsoftryunixjs-packagescore)
  - [`@unsetsoft/cra` (`packages/cra`)](#unsetsoftcra-packagescra)
  - [Paquetes sin Jest](#paquetes-sin-jest)
  - [Documentación relacionada](#documentación-relacionada)

---

## Resumen por paquete

| Paquete / ámbito | Ruta | Tests automatizados | Comando principal |
| :--------------- | :--- | :------------------ | :---------------- |
| `@unsetsoft/ryunixjs` | `packages/core` | **Sí** (Jest + jsdom) | `pnpm --filter @unsetsoft/ryunixjs test` |
| `@unsetsoft/ryunix-presets` | `packages/ryunix-presets` | No | [App de integración](./app-de-integracion-local.md) |
| `@unsetsoft/cra` | `packages/cra` | No | CLI manual (ver abajo) |
| `@unsetsoft/ryunix-devtools` | `packages/ryunix-devtools` | No | [App de integración](./app-de-integracion-local.md) |
| **Monorepo (raíz)** | `/` | Turbo orquesta `test` del core | `pnpm test`, `pnpm lint`, `pnpm build` |

El único paquete con suite Jest es `@unsetsoft/ryunixjs` (`packages/core`).

---

## Requisitos

- **Node.js**: 20, 22 o 24 (recomendado >= 22; ver `CONTRIBUTING.md`).
- **pnpm**: v10+ (`packageManager` en la raíz).
- Tras clonar: `pnpm install` en la raíz del monorepo.

---

## Comandos globales

| Comando | Qué hace |
| :------ | :------- |
| `pnpm install` | Instala dependencias de todos los workspaces. |
| `pnpm build` | Compila paquetes (Turbo; `build` depende de `^build`). |
| `pnpm test` | Ejecuta `test` en paquetes que lo definan (hoy: solo **core**). Turbo exige `build` antes. |
| `pnpm lint` | ESLint en la raíz + `lint` por paquete vía Turbo. |
| `pnpm lint:fix` | Corrige lint y formatea con Prettier. |
| `pnpm run lint:md` | Markdownlint en `docs/`, `*.md` raíz y README de paquetes. |

Los comandos `pnpm run:web*` no son tests automatizados; ver
[app-de-integracion-local.md](./app-de-integracion-local.md).

---

## Antes de abrir un PR

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

- No hay tests de integración SSR/SSG en el core; eso se valida en la
  [app de integración local](./app-de-integracion-local.md).
- Error `jest: orden no encontrada`: ejecutar `pnpm install` en la raíz.

---

## `@unsetsoft/cra` (`packages/cra`)

Scaffolder `npx @unsetsoft/cra`. **Sin tests automatizados** en el paquete CRA;
la comprobación es **manual** al ejecutar el generador.

### Ejecutar el CLI desde el monorepo

```bash
pnpm --filter @unsetsoft/cra dev

# O directamente con Node
node packages/cra/src/cli.js ../_cra/mi-app-prueba --latest
```

Para no mezclar con la app de integración, usar una carpeta fuera de `test/`
(p. ej. `_cra/`, también en `.gitignore`).

### Qué validar (generador)

| Paso | Comprobación |
| :--- | :----------- |
| Generación | Plantilla copiada (`ryunix-base`, `--tailwind`, `--eslint`, etc.) |
| `package.json` | Dependencias `@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` resueltas |
| Instalación | El asistente ejecuta el gestor de paquetes elegido sin error |
| App generada | `pnpm dev` arranca con `ryunix dev` |

Documentación: [CLI y ayudantes](../cra/cli-y-ayudantes.md),
[Generación de plantillas](../cra/generacion-de-plantillas.md).

---

## Paquetes sin Jest

| Paquete | Tests automatizados | Dónde validar cambios |
| :------ | :------------------ | :-------------------- |
| `@unsetsoft/ryunix-presets` | No | [App de integración](./app-de-integracion-local.md) — routing, build, SSR |
| `@unsetsoft/ryunix-devtools` | No | [App de integración](./app-de-integracion-local.md) — extensión + Chrome |

---

## Documentación relacionada

| Tema | Enlace |
| :--- | :----- |
| App de integración local | [app-de-integracion-local.md](./app-de-integracion-local.md) |
| Guía del repositorio | [guia-del-repositorio.md](./guia-del-repositorio.md) |
| Pila tecnológica y scripts | [pila-tecnologica-y-scripts.md](./pila-tecnologica-y-scripts.md) |
| Contribución | [CONTRIBUTING.es.md](../../CONTRIBUTING.es.md) |
| Índice docs | [resumen.md](../resumen.md) |
