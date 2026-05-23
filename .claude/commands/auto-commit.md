---
description: Commit con Conventional Commits (RyunixJS), sin coautoría de IA
argument-hint: [mensaje opcional o scope]
---

# Autocommit (Conventional Commits — RyunixJS)

Usar cuando el usuario pida **commit** / **autocommit**. Ver `CONTRIBUTING.md` y `.claude/rules/git-commits.md`.

## Cuándo

- Invocación **`/auto-commit`** o petición explícita de commit.
- **No** commitear sin petición del usuario.

## Antes de commitear

1. `git status` — incluir archivos `??` (sin seguimiento).
2. `git diff` / `git diff --staged`
3. `git log -15 --oneline`

**No** secretos (`.env`, credenciales). Si solo hay untracked, `git add` y commitear.

## Ramas (RyunixJS)

- Rama: `gh/[usuario]/[nombre-descriptivo]`
- PR → **`canary`**
- **No** bump manual de versiones en `package.json`

## Mensajes

Según `CONTRIBUTING.md`: **simples, descriptivos y en inglés** (asunto y cuerpo). Imperativo breve; sin punto final en la primera línea salvo convención del equipo.

### Lista (varias áreas)

```text
feat(core): add hook to public export

fix(presets): correct client webpack name in dev server
docs(guide): sync repository guide with docs/en layout
chore(claude): add Claude Code rules parity with cursor
```

### Clásico (un tema)

```text
feat(core): short subject

Optional body in English explaining why.
```

## Tipos y scopes

| type | Uso |
| :--- | :--- |
| `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` | estándar |

| scope | Cuándo |
| :--- | :--- |
| `core` | `packages/core` |
| `presets` | `packages/ryunix-presets` |
| `cra` | `packages/cra` |
| `devtools` | `packages/ryunix-devtools` |
| `readme` | `README.md` raíz |
| `guide` | `docs/repository-guide.md`, `docs/es/guia-del-repositorio.md` |
| `docs` | resto de `docs/` |
| `cursor` | `.cursor/` |
| `claude` | `.claude/`, `CLAUDE.md` |
| `ci`, `turbo` | CI / orquestación |

- **Inglés obligatorio** en el commit (simple y descriptivo); respuesta al usuario en **español** salvo otro idioma.
- **Sin** `Co-authored-by:` de IA; si Cursor lo insertó (commit no pusheado), reescribir con `git commit-tree` (`.claude/rules/git-commits.md`); `git commit --amend` no basta.

## Commit

```bash
git commit -m "$(cat <<'EOF'
docs(guide): update monorepo guide paths

chore(claude): add slash commands for Claude Code
EOF
)"
```

Verificar con `git status`. Hooks rechazados → corregir y **nuevo** commit (no `--no-verify` salvo petición).

Antes de PR: `pnpm run test` y `pnpm run lint`.

$ARGUMENTS
