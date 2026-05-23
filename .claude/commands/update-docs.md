---
description: Sincronizar README y docs/ con el código real del monorepo
argument-hint: [revisar | actualizar | archivo concreto]
---

# Actualizar documentación (RyunixJS)

Sincronizar documentación con el **código real**. Ver también `.cursor/commands/update-docs.md` (mismo contenido para Cursor).

## Cuándo

- **`/update-docs`** o petición explícita de actualizar docs.
- Tras cambios en paquetes, CLI `ryunix`, plantillas CRA, hooks públicos.
- **No** editar docs sin petición (salvo este comando).

## Fuentes de verdad

| Área | Dónde |
| :--- | :--- |
| Runtime | `packages/core/src/lib/`, `packages/core/package.json` |
| API pública | `packages/core/src/lib/index.js` |
| Tooling | `packages/ryunix-presets/webpack/bin/` |
| Routing / SSG | `packages/ryunix-presets/webpack/utils/`, `docs/ryunix-presets/`, `docs/en/ryunix-presets/` |
| Plantillas | `packages/cra/templates/ryunix-base/` |
| CRA | `packages/cra/src/`, `docs/cra/`, `docs/en/cra/` |
| Scripts | `package.json` raíz, `turbo.json` |
| Agentes | `.claude/`, `.cursor/` |

## Archivos a mantener

| Archivo | Rol |
| :--- | :--- |
| `README.md` | Presentación pública |
| `docs/en/overview.md`, `docs/es/resumen.md` | Índices |
| `docs/repository-guide.md` | Guía EN del monorepo |
| `docs/es/guia-del-repositorio.md` | Guía ES del monorepo |
| `docs/core/`, `docs/en/core/` | Runtime |
| `docs/ryunix-presets/`, `docs/en/ryunix-presets/` | Tooling |
| `docs/cra/`, `docs/en/cra/` | CRA |
| `CONTRIBUTING.md` | Contribución |
| `CLAUDE.md` | Entrada Claude (resumen; no duplicar todo el README) |

**No** asumir `README.EN.md` en la raíz.

## Baseline del producto

- Framework UI **standalone** (sin React embebido).
- Paquetes: `core`, `ryunix-presets`, `cra`, `ryunix-devtools`.
- Apps: `app/*.ryx`, `ryunix.config.js`, `ryunix dev|build|start`.
- Monorepo: pnpm + Turbo + ESLint + Prettier + Jest (core).

## Rutas obsoletas a corregir

- `packages/ryunix` → `packages/core`
- `docs/guia-del-repositorio.md` (raíz) → `docs/es/guia-del-repositorio.md`
- Next.js (`page.tsx`, `next dev`) → Ryunix (`.ryx`, `ryunix dev`)
- `useState` → `useStore` en ejemplos del core

## Proceso

1. Inspeccionar `packages/*`, plantillas CRA, scripts raíz.
2. Comparar README y `docs/` con el código.
3. Actualizar pares bilingües (`repository-guide` ↔ `guia-del-repositorio`).
4. Actualizar índices `docs/en/overview.md` / `docs/es/resumen.md` si hay docs nuevas (nombres en español en `docs/es/`).
5. Mantener paridad `.cursor/` ↔ `.claude/` si cambian convenciones de agente.

## Commits de docs

```text
docs(guide): sync monorepo paths with docs/es layout

docs(readme): update package table and quick start
chore(claude): align update-docs command with en/es docs
```

Si el usuario pide commit: usar `/auto-commit`.

$ARGUMENTS
