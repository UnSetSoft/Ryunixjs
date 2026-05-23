---
description: Auditoría global del monorepo RyunixJS (P0–P3), lint/build/test
argument-hint: [área opcional, p. ej. core o presets]
---

# Auditoría global de problemas (`/problems-search`)

## Cuándo ejecutar

- El usuario invoca **`/problems-search`** o pide auditoría global del repositorio.
- No corregir nada salvo petición posterior; primero **inventariar y priorizar**.

## Objetivo

Recorrer el monorepo **RyunixJS** de lo global a lo local; informe por prioridad **P0→P3**.

Impacto: publicación npm, CI, build de paquetes, plantillas CRA, runtime.

## Qué hacer

1. **Comprobaciones automáticas** (sin `--no-verify`, sin alterar git config):
   - `pnpm run lint`
   - `pnpm run build`
   - `pnpm run test` (si es posible)
   - Opcional: `pnpm run format:check`
2. Revisar según «Factores y prioridades».
3. **No inventar problemas**: citar ruta o salida de comando; hipótesis como _posible_.
4. Respetar `.claude/rules/component-scope.md` y `CONTRIBUTING.md`.
5. **No commitear ni pushear** sin petición explícita.

## Prioridades

| Nivel | Etiqueta | Criterio |
| :--- | :--- | :--- |
| **P0** | Crítico | Build, CI, publicación, API pública del core o plantillas rotas. |
| **P1** | Alto | SSR/hidratación, routing `.ryx`, Server Actions, runtime en plantillas. |
| **P2** | Medio | Lint, tests, presets/webpack, docs desalineadas. |
| **P3** | Bajo | Estilo, nitpicks, mejoras opcionales. |

### Áreas

1. **Monorepo / CI** — `.github/workflows/`, `package.json`, `turbo.json`, `pnpm-workspace.yaml`, engines vs `CONTRIBUTING.md`.
2. **`packages/core`** — reconciler, hooks, exports, tests.
3. **`packages/ryunix-presets`** — CLI `webpack/bin/`, plugins, loaders, config dual.
4. **`packages/cra`** — plantillas `.ryx`, `ryunix.config.js`.
5. **Documentación** — `README.md`, `docs/en/guides/`, `docs/es/guias/`, `docs/en/overview.md`, paridad `.cursor/` ↔ `.claude/`.
6. **Calidad** — ESLint, versiones manuales en `package.json`, rutas obsoletas en `.vscode/tasks.json`.
7. **DevTools / test/** — P3.

## Formato del informe (español)

```markdown
## Resumen ejecutivo
- X P0, Y P1, …
- Qué atacar primero (1–3 frases).

## P0 — Crítico
- [ ] **Título** — ruta — impacto — fix (1 línea)

## P1 — Alto
…

## P2 — Medio
…

## P3 — Bajo
…

## Comprobaciones ejecutadas
- comandos y resultado

## Sin hallazgos relevantes
- (opcional)
```

Máximo **~15–25 ítems** reales. Sin fixes masivos sin permiso del usuario.

$ARGUMENTS
