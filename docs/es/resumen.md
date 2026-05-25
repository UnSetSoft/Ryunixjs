# Documentación interna de RyunixJS

> **Language / Idioma:** [English](../en/overview.md) · [Español](./resumen.md)

Bienvenido a la documentación interna de **RyunixJS**. Estos documentos están
pensados para mantenedores, contribuidores del core y desarrolladores que
quieran entender cómo está construido el framework.

**Estás aquí:** `docs/es/resumen.md` — índice de la documentación en español.

---

## Índice

- [Documentación interna de RyunixJS](#documentación-interna-de-ryunixjs)
  - [Índice](#índice)
  - [Cómo está organizada esta carpeta](#cómo-está-organizada-esta-carpeta)
  - [`guias/` — Guías del monorepo](#guias--guías-del-monorepo)
  - [`core/` — `packages/core`](#core--packagescore)
  - [`ryunix-presets/` — `packages/ryunix-presets`](#ryunix-presets--packagesryunix-presets)
  - [`cra/` — `packages/cra`](#cra--packagescra)
  - [Orden de lectura sugerido](#orden-de-lectura-sugerido)
  - [Otros idiomas](#otros-idiomas)

---

## Cómo está organizada esta carpeta

Toda la documentación interna vive bajo `docs/`, dividida por idioma. En
español, los archivos usan **nombres en español**; las carpetas (`core/`,
`ryunix-presets/`, `cra/`) siguen alineadas con los paquetes en `packages/`.

```text
docs/
├── en/                              ← Inglés (nombres de archivo en inglés)
│   ├── overview.md
│   ├── guides/
│   ├── core/
│   ├── ryunix-presets/
│   └── cra/
└── es/                              ← Español (esta carpeta)
    ├── resumen.md                   ← Índice (este archivo)
    ├── guias/                     ← Guías del monorepo (nombres en español)
    ├── core/
    ├── ryunix-presets/
    └── cra/
```

| Ruta (desde `docs/es/`)                  | Paquete en el repo        | Qué encontrarás                                                         |
| :--------------------------------------- | :------------------------ | :---------------------------------------------------------------------- |
| [`./guias/`](./guias/)                   | _(raíz del monorepo)_     | Onboarding, pruebas, pila tecnológica y scripts raíz (ver guías abajo). |
| [`./core/`](./core/)                     | `packages/core`           | Reconciliador, hooks, renderizado, SSR, componentes.                    |
| [`./ryunix-presets/`](./ryunix-presets/) | `packages/ryunix-presets` | CLI `ryunix`, Webpack, routing, SSG, rutas API, loaders.                |
| [`./cra/`](./cra/)                       | `packages/cra`            | CLI `create-ryunix-app` y plantillas de proyecto.                       |

---

## `guias/` — Guías del monorepo

Documentos en `docs/es/guias/` describen **todo el repositorio**, no un paquete
concreto.

| Documento                                                              | Tema                                                                     |
| :--------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| [guia-del-repositorio.md](./guias/guia-del-repositorio.md)             | Qué es RyunixJS, estructura, comandos. **Punto de entrada tras clonar.** |
| [tests-automatizados.md](./guias/tests-automatizados.md)               | Jest en core, `pnpm test`, `pnpm lint`, CRA manual.                      |
| [app-de-integracion-local.md](./guias/app-de-integracion-local.md)     | App Ryunix en `test/webpack` con `workspace:*` y `pnpm run:web`.         |
| [pila-tecnologica-y-scripts.md](./guias/pila-tecnologica-y-scripts.md) | Tecnologías y scripts `pnpm` raíz (asistido por IA).                     |

---

## `core/` — `packages/core`

Motor del runtime: Virtual DOM, reconciliador Fiber, hooks, renderizado
cliente/servidor y componentes integrados.

| Documento                                                   | Tema                                                     |
| :---------------------------------------------------------- | :------------------------------------------------------- |
| [vdom-y-reconciliacion.md](./core/vdom-y-reconciliacion.md) | `createElement`, work loop, reconciliador, commit al DOM |
| [hooks.md](./core/hooks.md)                                 | `useStore`, `useEffect`, memoización, hooks en SSR       |
| [renderizado.md](./core/renderizado.md)                     | `render`, `hydrate`, `renderToString`, streaming         |
| [estado-y-prioridad.md](./core/estado-y-prioridad.md)       | Batching, cola de prioridad, `useTransition`             |
| [componentes-avanzados.md](./core/componentes-avanzados.md) | `lazy`, `Suspense`, `memo`, portals, `forwardRef`        |
| [componentes.md](./core/componentes.md)                     | Resumen de componentes integrados                        |
| [funciones-servidor.md](./core/funciones-servidor.md)       | Server Actions, `ServerBoundary`, `bridge.js`            |
| [limites-de-error.md](./core/limites-de-error.md)           | Error boundaries y overlay de desarrollo                 |
| [devtools-y-profiler.md](./core/devtools-y-profiler.md)     | Advertencias de desarrollo y profiler en memoria         |

---

## `ryunix-presets/` — `packages/ryunix-presets`

Tooling de build: CLI `ryunix`, Webpack dual (cliente + servidor), routing por
archivos, SSG y compilación de APIs.

| Documento                                                               | Tema                                                  |
| :---------------------------------------------------------------------- | :---------------------------------------------------- |
| [cli-y-arranque.md](./ryunix-presets/cli-y-arranque.md)                 | `ryunix dev`, `build`, `start`, servidores dev y prod |
| [carga-de-configuracion.md](./ryunix-presets/carga-de-configuracion.md) | Descubrimiento y normalización de `ryunix.config.js`  |
| [enrutamiento-y-ssg.md](./ryunix-presets/enrutamiento-y-ssg.md)         | `AppRouterPlugin`, SSG, handler SSR en desarrollo     |
| [enrutador-api.md](./ryunix-presets/enrutador-api.md)                   | Rutas API, compilación SWC, hot reload                |
| [loaders-webpack.md](./ryunix-presets/loaders-webpack.md)               | Loader RSC, loader de Server Actions                  |
| [errores-por-archivo.md](./ryunix-presets/errores-por-archivo.md)       | `error.ryx`, overlay global de desarrollo             |

---

## `cra/` — `packages/cra`

Scaffolder oficial (`npx @unsetsoft/cra`) y plantillas de proyecto.

| Documento                                                        | Tema                                                          |
| :--------------------------------------------------------------- | :------------------------------------------------------------ |
| [cli-y-ayudantes.md](./cra/cli-y-ayudantes.md)                   | CLI interactiva, `create-app.js`, resolución de versiones npm |
| [generacion-de-plantillas.md](./cra/generacion-de-plantillas.md) | `ryunix-base`, `ryunix-tailwind`, mecanismo de copia          |

---

## Orden de lectura sugerido

1. [Guía del repositorio](./guias/guia-del-repositorio.md) — contexto del
   monorepo

   y cómo encajan las piezas.

2. [Tests automatizados](./guias/tests-automatizados.md) y
   [app de integración](./guias/app-de-integracion-local.md) — Jest/lint y

   validación en navegador con `workspace:*`.

3. [core/vdom-y-reconciliacion.md](./core/vdom-y-reconciliacion.md) — cómo se

   actualiza la UI.

4. [ryunix-presets/cli-y-arranque.md](./ryunix-presets/cli-y-arranque.md) — cómo

   se compilan y sirven las apps.

5. Profundizar en cualquier doc de `core/` o `ryunix-presets/` según necesidad.

---

## Otros idiomas

| Idioma  | Índice                                   | Guía del monorepo                                          |
| :------ | :--------------------------------------- | :--------------------------------------------------------- |
| English | [docs/en/overview.md](../en/overview.md) | [repository-guide.md](../en/guides/repository-guide.md)    |
| Español | [docs/es/resumen.md](./resumen.md)       | [guia-del-repositorio.md](./guias/guia-del-repositorio.md) |

README público: [README.es.md](../../README.es.md) ·
[README.md](../../README.md).
