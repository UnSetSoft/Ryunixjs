# Actualizar documentación (RyunixJS)

Usar cuando el usuario pida **actualizar la documentación**, **sincronizar README**, **revisar docs** o invoque este comando. El objetivo es que la documentación refleje el **código real** del monorepo.

## Cuándo ejecutar

- El usuario invoca este comando o pide explícitamente actualizar documentación.
- Tras cambios en arquitectura, paquetes, CLI `ryunix`, plantillas CRA, hooks públicos o scripts raíz.
- **No** editar docs si el usuario no lo pidió (salvo que este comando sea la petición).

## Fuentes de verdad (revisar siempre antes de escribir)

Explorar el repo; **no** confiar solo en textos desactualizados.

| Área | Dónde mirar |
| :--- | :--- |
| Runtime (hooks, render, SSR) | `packages/core/src/lib/`, `packages/core/package.json` |
| API pública del core | `packages/core/src/lib/index.js`, `packages/core/README.md` |
| Tooling y CLI | `packages/ryunix-presets/webpack/bin/`, `packages/ryunix-presets/package.json` |
| Routing / SSG / API | `packages/ryunix-presets/webpack/utils/`, `docs/ryunix-presets/` |
| Plantillas de apps | `packages/cra/templates/ryunix-base/` (y variantes) |
| Scaffolding CRA | `packages/cra/src/`, `docs/cra/` |
| DevTools | `packages/ryunix-devtools/` |
| Scripts del monorepo | `package.json` raíz, `turbo.json`, `pnpm-workspace.yaml` |
| Contribución | `CONTRIBUTING.md`, `README.md` |
| Agentes (Cursor / Claude) | `.cursor/`, `.claude/`, `CLAUDE.md` |

## Archivos de documentación a mantener

| Archivo | Rol |
| :--- | :--- |
| `README.md` (raíz) | Presentación pública: qué es Ryunix, paquetes, inicio rápido con CRA |
| `docs/README.md` | Índice de documentación interna |
| `docs/repository-guide.md` | Guía EN del monorepo |
| `docs/es/guia-del-repositorio.md` | Guía ES del monorepo |
| `docs/es/resumen.md` | Índice docs en español |
| `docs/core/*.md`, `docs/en/core/*.md` | Runtime |
| `docs/ryunix-presets/*.md`, `docs/en/ryunix-presets/*.md` | Tooling |
| `docs/cra/*.md`, `docs/en/cra/*.md` | CRA y plantillas |
| `packages/core/README.md` | API del paquete publicado |
| `packages/*/README.md` | Readmes por paquete si existen |
| `CONTRIBUTING.md` | Setup, ramas, commits, releases |
| `.cursor/commands/auto-commit.md` | Convenciones de commit (no duplicar largo en README) |

**No** asumir `README.EN.md` en la raíz: este monorepo usa `README.md` + docs bilingües bajo `docs/` cuando aplique.

## Descripción actual del producto (baseline)

**RyunixJS** — framework de UI **standalone** (sin React embebido), monorepo con:

- `@unsetsoft/ryunixjs` (`packages/core`) — reconciler, hooks, SSR.
- `@unsetsoft/ryunix-presets` — CLI `ryunix`, Webpack dual, SSG, APIs.
- `@unsetsoft/cra` — `npx @unsetsoft/cra@latest`.
- `@unsetsoft/ryunix-devtools` — extensión de navegador.

**Apps generadas** (plantilla base): `app/*.ryx`, `app/layout.ryx`, `app/errors.ryx`, `app/api/**/router.js`, `ryunix.config.js`, scripts `ryunix dev|build|start`.

**Stack del monorepo:** pnpm workspaces, Turbo, ESLint 9, Prettier, Jest (core).

## Estructura de referencia (monorepo)

```
/
├── package.json          # scripts turbo, release, lint
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   ├── core/             # @unsetsoft/ryunixjs
│   ├── ryunix-presets/   # CLI ryunix + webpack
│   ├── cra/              # create-ryunix-app + templates/
│   └── ryunix-devtools/
├── docs/                 # documentación interna
├── assets/               # logo README
└── .github/              # CI, templates
```

**Rutas obsoletas a corregir si aparecen en docs:**

- `packages/ryunix` → `packages/core`
- `src/app/page.tsx` / Next.js App Router → `app/*.ryx` en apps Ryunix
- `useState` de React → `useStore` de Ryunix en ejemplos del core
- `next dev` / `next build` → `ryunix dev` / `ryunix build` en apps

## Secciones recomendadas al actualizar README raíz

1. Qué es RyunixJS y paquetes npm
2. Inicio rápido (`npx @unsetsoft/cra@latest`)
3. Características (SSR, SSG, hooks, zero deps en core)
4. Tabla de paquetes del monorepo
5. Desarrollo del monorepo (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`)
6. Enlace a `CONTRIBUTING.md`, `docs/repository-guide.md` y `docs/es/guia-del-repositorio.md`
7. Licencia

## Scripts a documentar (monorepo raíz)

| Comando | Descripción |
| :--- | :--- |
| `pnpm install` | Instalar workspaces |
| `pnpm run dev` | Desarrollo vía Turbo |
| `pnpm run build` | Build de paquetes |
| `pnpm run test` | Tests |
| `pnpm run lint` / `lint:fix` | ESLint + lint por paquete |
| `pnpm run format` / `format:check` | Prettier |
| `pnpm run clean` | Limpiar artefactos |
| `pnpm run run:web` | App de prueba webpack (requiere `test/` local) |
| `pnpm run release:canary` / `release:stable` | Release (mantenedores) |

## Reglas de redacción

- Prosa clara; tablas para paquetes y scripts.
- **No inventar** APIs o carpetas que no existan.
- **No documentar** secretos (`.env`, tokens).
- Guías ES/EN en `docs/`: misma estructura; enlaces cruzados al inicio del archivo.
- Si solo pidieron «revisar», listar desfases sin editar; si pidieron «actualizar», aplicar cambios.

## Proceso para el agente

1. Inspeccionar `packages/*`, scripts raíz y plantillas CRA.
2. Comparar `README.md`, `docs/` y readmes de paquetes con el código.
3. Actualizar par bilingüe `docs/repository-guide.md` ↔ `docs/es/guia-del-repositorio.md`.
4. Actualizar `docs/en/overview.md` y `docs/es/resumen.md` si hay documentos nuevos (mantener nombres en español bajo `docs/es/`).
5. Mantener paridad `.cursor/` ↔ `.claude/` si cambian convenciones de agente.
6. No modificar `auto-commit.md` salvo cambio explícito de convenciones de commit.

## Commits de documentación

Si el usuario pide commit, usar `.cursor/commands/auto-commit.md`:

```text
docs(guide): sync monorepo structure with packages and scripts

docs(readme): update getting started and package table
```

Scopes útiles: `readme`, `guide`, `core`, `presets`, `cra`, `cursor`, `claude`, `ci`.

## Resumen para el agente

- Este repo es el **framework**, no una app Next.js.
- El código manda; README y `docs/` se adaptan.
- Mantener coherencia con `.cursor/rules/component-scope.mdc` y `CONTRIBUTING.md`.
