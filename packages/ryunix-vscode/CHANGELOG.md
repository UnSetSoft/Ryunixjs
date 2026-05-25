# Changelog

## [1.0.5]

- Go to definition (Ctrl+click) for `@unsetsoft/ryunixjs` exports → `node_modules` or monorepo `packages/core`
- Hover docs for Ryunix hooks, HTML tags, and `className` tokens
- Defaults for Tailwind CSS IntelliSense in `.ryx` (`tailwindCSS.includeLanguages`)
- Setting `ryunix.enableNavigation` (default `true`)

## [Unreleased]

- Restructure package: `src/` (TypeScript), `language/`, `assets/`
- Extension logic split into `src/completion/*`; build outputs `out/extension.js`

## [1.0.4]

- Snippets: `ryx-loading`, `ryx-error`, `ryx-server-page`, `ryx-api-post`
- File-context completions (`layout.ryx`, `loading.ryx`, …) and `frontmatter` alias
- Remove unused `semanticTokenScopes` (no semantic token provider yet)
- TextMate regression tests (`test/grammar.test.cjs`, fixtures from `ryunix-base`)
- CRA `--vscode`: recommend ESLint + Ryunix; Prettier when `--eslint`; file nesting
- `ryunix-eslint` template: `.prettierrc.json` override for `*.ryx`
- README / docs: explicit scope (MDX, TS, formatter), Prettier guide, `ROADMAP.md`

## [1.0.3]

- Ryunix snippets (`ryx-page`, `ryx-layout`, `ryx-errors`, `ryx-import`, …)
- Completions for `@unsetsoft/ryunixjs` hooks and `Metatags` / `generateMetadata`
- Remove default `formatOnSave` (no bundled formatter)
- CRA `--vscode` writes `settings.json` (Emmet, ESLint, file associations)
- Bilingual README (EN / ES)

## [1.0.2]

- Monorepo package under `packages/ryunix-vscode`

## [1.0.0]

- Initial Marketplace release
