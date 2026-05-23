# RyunixJS — instrucciones para Claude Code

Monorepo del framework **RyunixJS** (`@unsetsoft/*`). No es una app de usuario:
no uses convenciones de Next.js salvo que el usuario lo pida.

## Paridad con Cursor

Las mismas reglas y comandos existen para **Cursor** en `.cursor/` y para
**Claude** en `.claude/`:

| Cursor                  | Claude Code                               |
| :---------------------- | :---------------------------------------- |
| `.cursor/rules/*.mdc`   | `.claude/rules/*.md`                      |
| `.cursor/commands/*.md` | `.claude/commands/*.md` → slash `/nombre` |

Comandos: `/problems-search`, `/auto-commit`, `/update-docs`

## Paquetes

| Paquete                      | Ruta                       |
| :--------------------------- | :------------------------- |
| `@unsetsoft/ryunixjs`        | `packages/core`            |
| `@unsetsoft/ryunix-presets`  | `packages/ryunix-presets`  |
| `@unsetsoft/cra`             | `packages/cra`             |
| `@unsetsoft/ryunix-devtools` | `packages/ryunix-devtools` |

Apps generadas: `app/*.ryx`, `app/layout.ryx`, `ryunix.config.js`, CLI
`ryunix dev|build|start`.

## Comandos del monorepo

```bash
pnpm install
pnpm run dev      # Turbo — desarrollo
pnpm run build
pnpm run test
pnpm run lint
pnpm run lint:fix
pnpm run format
```

Antes de PR: `pnpm run test` y `pnpm run lint` (ver `CONTRIBUTING.md`).

## Contribución

- Ramas: `gh/[usuario]/[nombre-descriptivo]`
- Target PR: **`canary`**
- **No** cambiar versiones en `package.json` manualmente
- Commits: Conventional Commits en **inglés**; ver

  `.claude/commands/auto-commit.md`

- **Nunca** añadir `Co-authored-by:` de IA/Claude salvo petición explícita

## Documentación

- Guía del repo (EN): `docs/en/guides/repository-guide.md`
- Guía del repo (ES): `docs/es/guias/guia-del-repositorio.md`
- Índice técnico (EN): `docs/en/overview.md`
- Índice técnico (ES): `docs/es/resumen.md` (archivos con nombres en español)
- Técnica por paquete: `docs/en/`, `docs/es/` (`core/`, `ryunix-presets/`,

  `cra/`)

## Reglas detalladas

@.claude/rules/component-scope.md @.claude/rules/git-commits.md
