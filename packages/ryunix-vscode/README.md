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
| **LSP** (diagnostics, go to definition, references, hover, rename) with `jsconfig.json` | Full strict TypeScript / complete project types |
| ESLint integration via workspace `eslint.probe` / `eslint.validate` | Bundled `formatOnSave` (use Prettier in the project) |
| Emmet in `ryunix` language mode | API routes: templates use `router.js`; `router.ryx` snippets are optional |
| Snippets + completions (LSP or lightweight mode without LSP) | `@/` aliases without matching `paths` in `jsconfig` (mirror `ryunix.config.js`) |

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

## Language Server (v1.1+)

With `"ryunix.languageServer.enable": true` (default), the workspace TypeScript
service provides diagnostics, completions, go to definition, references, and
rename in `.ryx`. Add a root `jsconfig.json` (CRA generates one with `--vscode`)
and mirror `webpack.resolve.alias` `@/` entries in `compilerOptions.paths` when
you use them.

Disable the LSP: `"ryunix.languageServer.enable": false` (snippets and
lightweight navigation remain).

## Complementary navigation

| Action | Behavior |
| :----- | :------- |
| **Ctrl+click** (go to definition) | Local imports, `@unsetsoft/ryunixjs`, `@/` aliases (with `jsconfig`) |
| **Hover** | Ryunix hooks, HTML tags, `className` tokens (always on) |
| **Tailwind** | Install [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) |

Disable hover/tags: `"ryunix.enableNavigation": false`.

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
