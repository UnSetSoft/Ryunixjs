<!-- markdownlint-disable MD013 -->

# Ryunix VS Code Extension

VS Code language support for Ryunix `.ryx` files (syntax highlighting,
snippets, and editor defaults).

**Marketplace ID:** `unsetsoft.ryunixjs`

## Install from Marketplace

Search for **RyunixJS** in the VS Code Extensions view, or:

```bash
code --install-extension unsetsoft.ryunixjs
```

CRA can add a workspace recommendation when scaffolding with `--vscode`.

## Develop in the monorepo

1. Open `packages/ryunix-vscode` in VS Code (or the whole monorepo).
2. Run **Extension** from `.vscode/launch.json` (F5) to open an Extension
   Development Host.
3. Open a `.ryx` file and confirm highlighting and snippets.

## Build & publish

From the repo root:

```bash
pnpm install
pnpm --filter ./packages/ryunix-vscode run build
```

Produces `packages/ryunix-vscode/ryunixjs-*.vsix`. Publishing to the
Marketplace (maintainers only):

```bash
pnpm --filter ./packages/ryunix-vscode run publish:marketplace
```

Requires a [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
publisher token for `unsetsoft`.

## Contents

| Path | Role |
| :--- | :--- |
| `syntaxes/JavaScriptRyunix.tmLanguage.json` | TextMate grammar for `.ryx` |
| `snippets/javascript.code-snippets` | Editor snippets |
| `language-configuration.json` | Brackets, comments, auto-closing |
| `tags-language-configuration.json` | Embedded tag language config |

This package is **not** published to npm; only the `.vsix` / Marketplace
release.
