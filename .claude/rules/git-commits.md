# Git commits

Al crear o enmendar commits en nombre del usuario:

- **Nunca** añadir `Co-authored-by:`, `Signed-off-by:` para Claude, Cursor u otra IA salvo petición explícita.
- El mensaje solo debe contener lo acordado (Conventional Commits, etc.).
- **Cursor inyecta** `Co-authored-by: Cursor` tras `git commit` y `git commit --amend` (no es un hook del repo). Las reglas no lo evitan; hay que quitarlo antes del push.
- Si no está pusheado, reescribir **sin** ese trailer. `git commit --amend -F msg.txt` **no basta** en Cursor (vuelve a inyectarse). Usar `git commit-tree`:

```bash
TREE=$(git rev-parse 'HEAD^{tree}')
PARENT=$(git rev-parse 'HEAD^')
NEW=$(git commit-tree "$TREE" -p "$PARENT" -F /path/to/msg.txt)
git reset --hard "$NEW"
git log -1 --format=%B
```

- Varios commits: reconstruir de más antiguo a más nuevo con `commit-tree`. Verificar: `git log -5 --format=%B | rg Co-authored` (sin coincidencias).

Ver también `.claude/commands/auto-commit.md`.
