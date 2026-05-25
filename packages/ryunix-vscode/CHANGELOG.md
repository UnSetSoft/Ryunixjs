# Changelog

## [1.1.1]

- Fix LSP "Could not find source file" on hover and file watchers
- Sync open editor buffers with TypeScript (unsaved `.ryx` content)
- Normalize file paths; avoid full project reset on every watch event

## [1.1.0]

- **Language Server (LSP)** backed by TypeScript for `.ryx` files
  - Diagnostics (syntax + semantic)
  - Go to definition, find references, hover with types
  - Completions, document symbols, rename, signature help
- Setting `ryunix.languageServer.enable` (default `true`)
- `types/ryunix.d.ts` + `jsconfig.json` in CRA templates for editor project
- Bundle server (~TypeScript) and client via esbuild for Marketplace `.vsix`

## [1.0.5]

- Go to definition (Ctrl+click) for `@unsetsoft/ryunixjs` exports → `node_modules` or monorepo `packages/core`
- Hover docs for Ryunix hooks, HTML tags, and `className` tokens
- Defaults for Tailwind CSS IntelliSense in `.ryx` (`tailwindCSS.includeLanguages`)
- Setting `ryunix.enableNavigation` (default `true`)

## [Unreleased]

- Restructure package: `src/` (TypeScript), `language/`, `assets/`

## [1.0.4]

- Snippets: `ryx-loading`, `ryx-error`, `ryx-server-page`, `ryx-api-post`
- File-context completions and `frontmatter` alias
- CRA `--vscode` improvements, grammar tests

## [1.0.3]

- Ryunix snippets and completions
- Remove default `formatOnSave`
- Bilingual README

## [1.0.2]

- Monorepo package under `packages/ryunix-vscode`

## [1.0.0]

- Initial Marketplace release
