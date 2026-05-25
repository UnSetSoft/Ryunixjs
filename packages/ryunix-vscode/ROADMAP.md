# Ryunix VS Code extension — roadmap

## Shipped (1.0.5)

- TextMate grammar for `.ryx` (JS + embedded JSX)
- Ryunix snippets and file-context completions
- **Go to definition** and **hover** for core exports, HTML tags, `className`
- Tailwind IntelliSense defaults for `ryunix` language
- CRA `--vscode` workspace (ESLint probe, Emmet, file nesting)
- Optional Prettier via project config (`--eslint` template)

## Not in scope (use other tools)

| Topic | Where it is handled |
| :---- | :------------------ |
| MDX (`.mdx`) | `@mdx-js/loader` at build time |
| TypeScript in `.ryx` | Not supported; use `.js` or future `.ts` convention |
| Bundled formatter | Prettier + `prettier.documentSelectors` in app workspace |

## Future (high effort)

| Feature | Notes |
| :------ | :---- |
| Full Language Server (LSP) | Cross-file refs, types, rename — beyond import→core navigation |
| Semantic tokens | Removed unused `semanticTokenScopes` until a provider exists |
| Server/client inlay hints | Would duplicate `AppRouterPlugin` heuristics from build |
| Official Ryunix formatter | Prettier `overrides` for `*.ryx` is the practical path today |

Contributions should run `pnpm --filter ./packages/ryunix-vscode run test` when
touching `syntaxes/JavaScriptRyunix.tmLanguage.json`.
