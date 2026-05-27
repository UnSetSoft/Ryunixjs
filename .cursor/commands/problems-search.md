# Auditoría global de problemas (`/problems-search`)

## Cuándo ejecutar

- El usuario invoca **`/problems-search`** o pide una **búsqueda / auditoría global** de problemas del repositorio.
- No implica corregir nada salvo que el usuario lo pida después; el objetivo primero es **inventariar y priorizar**.

## Objetivo

Recorrer el monorepo **RyunixJS** de forma sistemática, desde lo **más global y crítico** hasta lo **más local**, y entregar un informe ordenado por **prioridad** (P0→P3).

Considerar impacto en **publicación npm**, **CI**, **build de paquetes**, **apps generadas por CRA** y **regresiones del runtime**.

## Qué debe hacer el asistente

1. **Ejecutar comprobaciones automáticas** cuando sea posible (sin saltar hooks ni alterar git config):
   - `pnpm run lint`
   - `pnpm run build`
   - `pnpm run test` (si el entorno lo permite)
   - Opcional: `pnpm run format:check`
2. **Revisar código y configuración** según las áreas del apartado «Factores y prioridades».
3. **No inventar problemas**: cada hallazgo debe citar archivo/ruta o salida de comando; hipótesis marcadas como _posible_.
4. **Respetar reglas del repo** (`.cursor/rules/component-scope.mdc`, `.claude/rules/`, `CONTRIBUTING.md`).
5. **No commitear ni pushear** salvo petición explícita del usuario.

## Factores y prioridades (de mayor a menor)

| Nivel | Etiqueta | Criterio orientativo |
| :--- | :--- | :--- |
| **P0** | Crítico | Rompe build, CI, publicación, API pública del core o apps plantilla. |
| **P1** | Alto | Regresión SSR/hidratación, routing `.ryx`, Server Actions, errores runtime probables en plantillas. |
| **P2** | Medio | Lint, tests fallidos, deuda en presets/webpack, docs desalineadas con código. |
| **P3** | Bajo | Estilo, nitpicks, mejoras opcionales sin impacto inmediato. |

### 1. Monorepo e infraestructura (P0–P1)

- **Build y CI**: `.github/workflows/`, scripts en `package.json` raíz, `turbo.json`, `pnpm-workspace.yaml`.
- **Engines**: `package.json` (`node`, `pnpm`) vs `CONTRIBUTING.md`.
- **Lockfile / workspaces**: coherencia entre paquetes en `packages/*`.
- **Secretos**: `.env` en git, credenciales hardcodeadas.

### 2. `packages/core` — runtime (P0–P1)

- Reconciler, hooks, render, hidratación, SSR (`packages/core/src/lib/`).
- Exports públicos en `packages/core/src/lib/index.js` y `packages/core/src/main.js`.
- Tests en `packages/core/src/tests/`.
- Cambios que rompan API (`useStore`, `createElement`, `hydrate`, etc.).

### 3. `packages/ryunix-presets` — tooling (P0–P2)

- CLI: `webpack/bin/` (`dev`, `build`, `start`, `prerender`).
- Plugins: `appRouterPlugin`, SSG, API router.
- Loaders: RSC, server actions.
- Config dual cliente/servidor en `webpack.config.mjs`.

### 4. `packages/cra` — plantillas (P1–P2)

- Plantillas en `packages/cra/templates/` (`ryunix-base`, `ryunix-tailwind`, etc.).
- `app/*.ryx`, `layout.ryx`, `errors.ryx`, `app/api/**/router.js`.
- `ryunix.config.js` y `package.json` de plantilla alineados con presets actuales.

### 5. Documentación (P2–P3)

- `README.md` raíz vs paquetes reales.
- `docs/` (`docs/en/overview.md`, `docs/en/guides/`, `docs/es/guias/`, `docs/es/resumen.md`) vs estructura actual.
- Enlaces rotos entre guías ES/EN.
- `.cursor/` y `.claude/` alineados con el monorepo (no referencias a Next.js u otros proyectos).

### 6. Calidad y mantenimiento (P2–P3)

- ESLint (`eslint.config.mjs`, `.eslintrc.json` legacy en CI).
- Código muerto, TODOs antiguos, versiones manuales en `package.json` (CONTRIBUTING pide no tocarlas).
- `.vscode/tasks.json` con rutas obsoletas (`packages/ryunix` vs `packages/core`).

### 7. DevTools y test local (P3)

- `packages/ryunix-devtools/` (manifest, hooks).
- Carpeta `test/` ignorada por git: solo relevante si el mantenedor la tiene localmente.

## Formato del informe (obligatorio)

Responder en **español**, con esta estructura:

```markdown
## Resumen ejecutivo

- X críticos (P0), Y altos (P1), …
- 1–3 frases: qué duele más y qué conviene atacar primero.

## P0 — Crítico

- [ ] **Título breve** — archivo/ruta — impacto — sugerencia de fix (1 línea)

## P1 — Alto

…

## P2 — Medio

…

## P3 — Bajo

…

## Comprobaciones ejecutadas

- Lista de comandos corridos y si pasaron o fallaron.

## Sin hallazgos relevantes

- Áreas revisadas donde no se detectó nada (opcional, breve).
```

- Máximo **~15–25 ítems** con impacto real; agrupar nitpicks en P3.
- Si no hay P0/P1, decirlo explícitamente.

## Resumen para el agente

- Auditoría del **monorepo RyunixJS**, no de apps Next.js externas.
- Evidencia con rutas y salidas de comandos.
- Informe estructurado; **no** aplicar fixes masivos sin que el usuario lo pida.
