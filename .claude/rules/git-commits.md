# Git commits

Al crear o enmendar commits en nombre del usuario:

- **Nunca** añadir `Co-authored-by:`, `Signed-off-by:` para Claude, Cursor u otra IA salvo petición explícita.
- El mensaje solo debe contener lo acordado (Conventional Commits, etc.).
- Si el entorno inserta `Co-authored-by: Claude` o similar tras `git commit`, enmendar (solo si no está pusheado) con el mismo mensaje **sin** ese trailer: `git commit --amend -F /path/to/msg.txt` y verificar con `git log -1 --format=%B`.

Ver también `.claude/commands/auto-commit.md`.
