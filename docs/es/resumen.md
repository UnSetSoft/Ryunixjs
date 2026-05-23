# Documentación interna de RyunixJS

Bienvenido a la documentación interna de **RyunixJS**. Estos documentos están pensados para mantenedores, contribuidores del core y desarrolladores que quieran entender cómo está construido el framework.

**Estás aquí:** `docs/es/resumen.md` — índice de la documentación en español.

---

## Cómo está organizada esta carpeta

Toda la documentación interna vive bajo `docs/`, dividida por idioma. En español, los archivos usan **nombres en español**; las carpetas (`core/`, `ryunix-presets/`, `cra/`) siguen alineadas con los paquetes en `packages/`.

```text
docs/
├── en/                              ← Inglés (nombres de archivo en inglés)
│   ├── overview.md
│   ├── repository-guide.md
│   ├── core/
│   ├── ryunix-presets/
│   └── cra/
└── es/                              ← Español (esta carpeta)
    ├── resumen.md                   ← Índice (este archivo)
    ├── guia-del-repositorio.md      ← Onboarding del monorepo
    ├── core/
    ├── ryunix-presets/
    └── cra/
```

| Ruta (desde `docs/es/`) | Paquete en el repo | Qué encontrarás |
| :--- | :--- | :--- |
| [`./guia-del-repositorio.md`](./guia-del-repositorio.md) | *(raíz del monorepo)* | Qué es RyunixJS, comparación con Next.js, archivos de la raíz, comandos útiles. **Mejor punto de entrada tras clonar.** |
| [`./core/`](./core/) | `packages/core` | Reconciliador, hooks, renderizado, SSR, componentes. |
| [`./ryunix-presets/`](./ryunix-presets/) | `packages/ryunix-presets` | CLI `ryunix`, Webpack, routing, SSG, rutas API, loaders. |
| [`./cra/`](./cra/) | `packages/cra` | CLI `create-ryunix-app` y plantillas de proyecto. |

Versión en inglés de este índice: [docs/en/overview.md](../en/overview.md).

---

## `guia-del-repositorio.md` — Guía del monorepo

Documento único en la raíz de `docs/es/`. Explica **todo el repositorio** para quien abre el monorepo por primera vez.

- [Guía del repositorio](./guia-del-repositorio.md)

Equivalente en inglés: [Repository guide](../en/repository-guide.md).

---

## `core/` — `packages/core`

Motor del runtime: Virtual DOM, reconciliador Fiber, hooks, renderizado cliente/servidor y componentes integrados.

| Documento | Tema |
| :--- | :--- |
| [vdom-y-reconciliacion.md](./core/vdom-y-reconciliacion.md) | `createElement`, work loop, reconciliador, commit al DOM |
| [hooks.md](./core/hooks.md) | `useStore`, `useEffect`, memoización, hooks en SSR |
| [renderizado.md](./core/renderizado.md) | `render`, `hydrate`, `renderToString`, streaming |
| [estado-y-prioridad.md](./core/estado-y-prioridad.md) | Batching, cola de prioridad, `useTransition` |
| [componentes-avanzados.md](./core/componentes-avanzados.md) | `lazy`, `Suspense`, `memo`, portals, `forwardRef` |
| [componentes.md](./core/componentes.md) | Resumen de componentes integrados |
| [funciones-servidor.md](./core/funciones-servidor.md) | Server Actions, `ServerBoundary`, `bridge.js` |
| [limites-de-error.md](./core/limites-de-error.md) | Error boundaries y overlay de desarrollo |
| [devtools-y-profiler.md](./core/devtools-y-profiler.md) | Advertencias de desarrollo y profiler en memoria |

---

## `ryunix-presets/` — `packages/ryunix-presets`

Tooling de build: CLI `ryunix`, Webpack dual (cliente + servidor), routing por archivos, SSG y compilación de APIs.

| Documento | Tema |
| :--- | :--- |
| [cli-y-arranque.md](./ryunix-presets/cli-y-arranque.md) | `ryunix dev`, `build`, `start`, servidores dev y prod |
| [carga-de-configuracion.md](./ryunix-presets/carga-de-configuracion.md) | Descubrimiento y normalización de `ryunix.config.js` |
| [enrutamiento-y-ssg.md](./ryunix-presets/enrutamiento-y-ssg.md) | `AppRouterPlugin`, SSG, handler SSR en desarrollo |
| [enrutador-api.md](./ryunix-presets/enrutador-api.md) | Rutas API, compilación SWC, hot reload |
| [loaders-webpack.md](./ryunix-presets/loaders-webpack.md) | Loader RSC, loader de Server Actions |
| [errores-por-archivo.md](./ryunix-presets/errores-por-archivo.md) | `error.ryx`, overlay global de desarrollo |

---

## `cra/` — `packages/cra`

Scaffolder oficial (`npx @unsetsoft/cra`) y plantillas de proyecto.

| Documento | Tema |
| :--- | :--- |
| [cli-y-ayudantes.md](./cra/cli-y-ayudantes.md) | CLI interactiva, `create-app.js`, resolución de versiones npm |
| [generacion-de-plantillas.md](./cra/generacion-de-plantillas.md) | `ryunix-base`, `ryunix-tailwind`, mecanismo de copia |

---

## Orden de lectura sugerido

1. [Guía del repositorio](./guia-del-repositorio.md) — contexto del monorepo y cómo encajan las piezas.
2. [core/vdom-y-reconciliacion.md](./core/vdom-y-reconciliacion.md) — cómo se actualiza la UI.
3. [ryunix-presets/cli-y-arranque.md](./ryunix-presets/cli-y-arranque.md) — cómo se compilan y sirven las apps.
4. Profundizar en cualquier doc de `core/` o `ryunix-presets/` según necesidad.

---

## Otros idiomas

| Idioma | Índice | Guía del monorepo |
| :--- | :--- | :--- |
| English | [docs/en/overview.md](../en/overview.md) | [repository-guide.md](../en/repository-guide.md) |
| Español | [docs/es/resumen.md](./resumen.md) | [guia-del-repositorio.md](./guia-del-repositorio.md) |

README público: [README.es.md](../../README.es.md) · [README.md](../../README.md).
