<!-- markdownlint-disable MD033 MD041 MD013 MD060 -->

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
with `--vscode` (recommends Ryunix + ESLint; Prettier when `--eslint` is set).
Install the recommended extensions when VS Code prompts you.

## Scope

| Supported in this extension | Not supported (use other tooling) |
| :-------------------------- | :-------------------------------- |
| `.ryx` as JS + JSX (TextMate) | MDX (`.mdx`) — validated at build via `@mdx-js/loader` |
| ESLint integration via workspace `eslint.probe` / `eslint.validate` | TypeScript inside `.ryx` |
| Emmet in `ryunix` language mode | Bundled `formatOnSave` (use Prettier in the project) |
| Snippets + lightweight completions | API routes: templates use `router.js`; `router.ryx` snippets are optional |

File-context completions (e.g. layout template in `layout.ryx`) and `frontmatter`
as an alias for `Metatags` are provided by `extension.js`.

## Snippets (prefix)

| Prefix                     | Use                                          |
| :------------------------- | :------------------------------------------- |
| `ryx-page`                 | Client route page (`Metatags` + default export) |
| `ryx-server-page`          | Server `index.ryx` (`async` default + `Metatags`) |
| `ryx-layout`               | Root layout with `children`                  |
| `ryx-loading`              | Route `loading.ryx` (Suspense UI)            |
| `ryx-error`                | Route `error.ryx` (error boundary)           |
| `ryx-errors`               | Global `errors.ryx` / 404 page               |
| `ryx-metatags`             | `export const Metatags` only                 |
| `ryx-import`               | `import { … } from '@unsetsoft/ryunixjs'`    |
| `ryx-link` / `ryx-navlink` | Client navigation                            |
| `ryx-api-get` / `ryx-api-post` | API `GET` / `POST` handlers              |
| `ryx-component`            | Generic component                            |

Type inside an `import { … }` block for completions (`useStore`, `Link`, …).

## Navigation (v1.0.5+)

| Action | Behavior |
| :----- | :------- |
| **Ctrl+click** (go to definition) | On `useStore`, `Link`, … opens `@unsetsoft/ryunixjs` in `node_modules` or monorepo `packages/core` |
| **Hover** | Docs for Ryunix exports, HTML tags (`<main>`), and tokens in `className` |
| **Tailwind** | Install [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) for full utility docs (class priority/conflicts as in HTML+TW stacks) |

Disable: `"ryunix.enableNavigation": false` in settings.

## Optional Prettier (projects with `--eslint`)

The `ryunix-eslint` CRA template ships `.prettierrc.json` with a `*.ryx` override
(`parser: "babel"`). With `--vscode --eslint`, CRA also sets:

```json
"[ryunix]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
"prettier.documentSelectors": ["**/*.ryx"]
```

Install the **Prettier** extension when prompted.

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
code --install-extension packages/ryunix-vscode/ryunixjs-1.0.4.vsix
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

## Package layout

```text
packages/ryunix-vscode/
├── src/                    # TypeScript extension source
│   ├── extension.ts
│   └── completion/         # providers, hooks, file-context templates
├── out/                    # Compiled JS (generated; not in .vsix source map only)
├── language/               # Language configuration JSON
├── syntaxes/               # TextMate grammar
├── snippets/
├── assets/                 # icon + logos
└── test/                   # Grammar regression tests
```

Develop: `pnpm --filter ./packages/ryunix-vscode run compile` (or `watch`), then **F5**
in this folder. Release build runs `compile` automatically via `prebuild`.

Grammar tests: `pnpm --filter ./packages/ryunix-vscode run test`.

See `ROADMAP.md` for LSP / semantic tokens (future).

This package is **not** published to npm; only the `.vsix` / Marketplace
release.
