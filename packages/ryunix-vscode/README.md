<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

# Ryunix VS Code Extension

VS Code language support for Ryunix `.ryx` files: syntax highlighting (JS +
JSX), Ryunix snippets, autocomplete for core hooks, and workspace defaults.

**Marketplace ID:** `unsetsoft.ryunixjs`

## Install from Marketplace

Search for **RyunixJS** in the VS Code Extensions view, or:

```bash
code --install-extension unsetsoft.ryunixjs
```

CRA adds `.vscode/extensions.json` and `.vscode/settings.json` when scaffolding
with `--vscode` (Emmet, ESLint validate, `*.ryx` → `ryunix`).

## Snippets (prefix)

| Prefix                     | Use                                          |
| :------------------------- | :------------------------------------------- |
| `ryx-page`                 | New route page (`Metatags` + default export) |
| `ryx-layout`               | Root layout with `children`                  |
| `ryx-errors`               | `errors.ryx` / 404 page                      |
| `ryx-metatags`             | `export const Metatags` only                 |
| `ryx-import`               | `import { … } from '@unsetsoft/ryunixjs'`    |
| `ryx-link` / `ryx-navlink` | Client navigation                            |
| `ryx-api-get`              | API `GET` handler                            |
| `ryx-component`            | Generic component                            |

Type inside an `import { … }` block for completions (`useStore`, `Link`, …).

## Test locally (Extension Development Host)

1. Open the monorepo (or `packages/ryunix-vscode`) in VS Code.
2. **Run and Debug** → configuration **Extension** → press **F5**.
3. A new VS Code window opens with the extension loaded (title bar shows
   `[Extension Development Host]`).
4. In that window: **File → Open Folder** → e.g.
   `packages/cra/templates/ryunix-base` or your Ryunix app.
5. Open or create `app/index.ryx` and check:
   - Syntax highlighting on JSX tags and JS.
   - Snippets: type `ryx-page` + Tab on an empty file.
   - Completions: `import { use` → `useStore`, etc.
6. After code changes: stop the debug session and press **F5** again, or run
   **Developer: Reload Window** in the Extension Development Host.

### Install `.vsix` without Marketplace

```bash
pnpm install
pnpm --filter ./packages/ryunix-vscode run build
code --install-extension packages/ryunix-vscode/ryunixjs-1.0.3.vsix
```

Use **Extensions: Install from VSIX…** from the Command Palette if needed.

## Build & publish

From the repo root:

```bash
pnpm install
pnpm --filter ./packages/ryunix-vscode run build
```

Publishing to the Marketplace (maintainers only):

```bash
pnpm --filter ./packages/ryunix-vscode run publish:marketplace
```

Requires a [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
publisher token for `unsetsoft`.

## Contents

| Path                                        | Role                                          |
| :------------------------------------------ | :-------------------------------------------- |
| `extension.js`                              | Completions for `@unsetsoft/ryunixjs` exports |
| `syntaxes/JavaScriptRyunix.tmLanguage.json` | TextMate grammar for `.ryx`                   |
| `snippets/javascript.code-snippets`         | Ryunix + JSX snippets                         |
| `language-configuration.json`               | Brackets, comments, auto-closing              |
| `tags-language-configuration.json`          | Embedded tag language config                  |

This package is **not** published to npm; only the `.vsix` / Marketplace
release.
