# Autocommit (Conventional Commits — RyunixJS)

Usar cuando el usuario pida **hacer commit** del trabajo actual con mensajes alineados al proyecto. Ver también `CONTRIBUTING.md`, `.cursor/rules/git-commits.mdc` y paridad `.claude/commands/auto-commit.md`.

## Cuándo ejecutar

- El usuario invoca este comando o pide explícitamente **commit** / **autocommit**.
- **No** crear commits si el usuario no lo pidió.

## Antes de commitear (siempre)

En paralelo cuando tenga sentido:

1. `git status` — modificados y **sin seguimiento** (`??`). `git diff` solo muestra rastreados; revisar siempre `status` antes de `add`.
2. `git diff` y, si hace falta, `git diff --staged`.
3. `git log -15 --oneline` — tono reciente del repo.

**No** incluir secretos (`.env`, credenciales, etc.).

Si solo hay archivos sin seguimiento y el usuario pidió commit, hacer `git add <ruta>` y commitear; no decir «no hay nada» solo porque `git diff` está vacío.

## Ramas y destino (RyunixJS)

- Formato de rama: `gh/[usuario]/[nombre-descriptivo]` (ver `CONTRIBUTING.md`).
- PRs hacia **`canary`**, no asumir `main`/`master` sin comprobar.
- **No** cambiar versiones en `package.json` manualmente (lo gestiona el release).

## Regla de mensajes (`CONTRIBUTING.md`)

Los mensajes de commit deben ser **simples, descriptivos y en inglés** (asunto y cuerpo opcional). Redactar en imperativo (`add`, `fix`, `update`); evitar frases largas o vagas («misc changes», «wip»).

## Formas de mensaje

### A) Formato lista — preferido si el commit toca **varias áreas**

Cada línea:

`<type>(<scope>): <acción en imperativo, inglés, sin punto final>`

- **Primera línea:** resumen para `git log --oneline`.
- **Líneas siguientes:** un bloque lógico por línea (misma plantilla).

Ejemplo:

```text
feat(core): add useDeferredValue to public hooks export

fix(presets): correct client webpack name in dev server
docs(guide): document monorepo root layout in Spanish
chore(cursor): align commands with RyunixJS monorepo
```

### B) Formato clásico — commit **atómico** o un solo tema

```text
<type>(<scope opcional>): <descripción breve>

Optional body in full English sentences explaining why.

BREAKING CHANGE: only if consumers must migrate.
```

## Tipos (`type`)

| Tipo | Uso en RyunixJS |
| :--- | :--- |
| `feat` | Nueva capacidad (core, presets, CRA, plantillas). |
| `fix` | Corrección de bug o regresión. |
| `docs` | README, `docs/`, comentarios de arquitectura. |
| `refactor` | Reestructuración sin cambio de comportamiento observable. |
| `perf` | Rendimiento (reconciler, build). |
| `test` | Tests en `packages/core` u otros paquetes. |
| `build` | Build, Rollup, Webpack, dependencias. |
| `ci` | `.github/workflows/`. |
| `chore` | Mantenimiento (`.gitignore`, scripts auxiliares). |

## Scopes (`scope`) habituales

| Scope | Cuándo |
| :--- | :--- |
| `core` | `packages/core` |
| `presets` | `packages/ryunix-presets` |
| `cra` | `packages/cra` |
| `devtools` | `packages/ryunix-devtools` |
| `readme` | `README.md` raíz |
| `guide` | `docs/en/guides/`, `docs/es/guias/` |
| `docs` | Otros archivos en `docs/` |
| `cursor` | `.cursor/` |
| `claude` | `.claude/`, `CLAUDE.md` |
| `ci` | GitHub Actions |
| `turbo` | `turbo.json`, scripts raíz de orquestación |

Evitar scopes de otros proyectos (`learning`, `pomodoro`, `overview` de apps ajenas).

## Estilo

- **Simples, descriptivos y en inglés** (obligatorio en asunto y cuerpo).
- Imperativo: _add_, _fix_, _update_, _remove_.
- ~72 caracteres en la primera línea cuando sea razonable.
- No encadenar varios `feat:` en una sola línea.
- No usar español ni mezcla de idiomas en el mensaje del commit.

## Cómo crear el commit

```bash
git commit -m "$(cat <<'EOF'
docs(guide): add repository guide for monorepo contributors

docs(readme): link to internal docs index
chore(cursor): replace WEB-Time commands with RyunixJS
EOF
)"
```

3. `git status` para verificar.
4. Si un **hook** rechaza el commit: corregir y **nuevo** commit; no `--no-verify` salvo petición explícita.
5. **Sin** `Co-authored-by:` ni firmas de IA (ver `.cursor/rules/git-commits.mdc`).
6. Si Cursor insertó `Co-authored-by: Cursor` y el commit **no está pusheado**, reescribir con `git commit-tree` (ver `.cursor/rules/git-commits.mdc`); `git commit --amend` **no** quita el trailer en Cursor.

## Verificación antes de PR

`CONTRIBUTING.md` recomienda:

```bash
pnpm run test
pnpm run lint
```

## Resumen para el agente

- Diff + log antes de redactar.
- Commits multi-paquete → **formato lista** con scopes `core`, `presets`, `cra`, etc.
- Mensaje del commit: **simple, descriptivo y en inglés**; respuesta al usuario en **español** salvo que pida otro idioma.
- Sin trailers de coautoría de IA.
