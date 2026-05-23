# Alcance de código en RyunixJS

Este repositorio es un **monorepo del framework**, no una app de usuario. Coloca cada cambio en el **paquete y carpeta correctos**; no mezclar runtime, tooling y plantillas.

## Monorepo — árbol de decisión

1. **¿Motor de UI (VDOM, hooks, reconciler, render)?** → `packages/core/src/lib/` o `packages/core/jsx/`.
2. **¿Webpack, CLI `ryunix`, routing compile-time, SSG, API server?** → `packages/ryunix-presets/webpack/`.
3. **¿Scaffolding, plantillas `create-app`, helpers del CLI?** → `packages/cra/src/` o `packages/cra/templates/`.
4. **¿Extensión de navegador DevTools?** → `packages/ryunix-devtools/`.
5. **¿Documentación?** → `docs/` (`docs/en/`, `docs/es/`, `docs/core/`, `docs/repository-guide.md`, `docs/es/guia-del-repositorio.md`).
6. **¿Scripts globales, Turbo, ESLint raíz?** → raíz (`package.json`, `turbo.json`, `eslint.config.mjs`).
7. **¿App de prueba local?** → `test/` (gitignored).

## Mapa de paquetes

| Qué es | Dónde |
| :--- | :--- |
| Reconciler, fibers, hooks, SSR core | `packages/core/src/lib/` |
| Tests del core | `packages/core/src/tests/` |
| JSX runtime | `packages/core/jsx/` |
| Build, `ryunix dev/build/start` | `packages/ryunix-presets/webpack/` |
| Plantillas CRA | `packages/cra/templates/` |
| Docs | `docs/` |
| README público | `README.md` |

## Reglas

- **Prohibido** meter Webpack/routing en `packages/core` salvo APIs que el core exporte al servidor.
- **Prohibido** duplicar hooks o reconciler en `ryunix-presets`; usar `@unsetsoft/ryunixjs`.
- Plantillas CRA: estructura real de `npx @unsetsoft/cra` (`.ryx`, `ryunix.config.js`).
- Fixes multi-paquete: commits separados o formato lista (`.claude/commands/auto-commit.md`).

## Apps Ryunix (plantillas o proyectos generados)

Ver `packages/cra/templates/ryunix-base/`:

| Alcance | Ubicación |
| :--- | :--- |
| Página / ruta | `app/index.ryx`, `app/<ruta>/index.ryx` |
| Layout | `app/layout.ryx` |
| Errores | `app/errors.ryx` |
| API | `app/api/<nombre>/router.js` |
| Estilos | `styles/` |
| Config | `ryunix.config.js` |

- **Prohibido** en apps: `src/features/`, `page.tsx`, `next.config.ts` salvo petición explícita.
- Colocalizar UI usada solo en una ruta; carpeta compartida solo con **segundo consumidor**.

## Antes de crear un archivo

¿Es runtime, tooling, plantilla, docs o app de prueba? Entre `core` y `presets`: ¿corre en el navegador como UI o solo en Node/Webpack en build?
