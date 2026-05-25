# Ryunix VS Code extension — roadmap

## Shipped (1.1.0)

- TextMate grammar, snippets, Emmet/Tailwind defaults
- **Language Server (LSP)** on TypeScript `LanguageService` for `.ryx`
  - Diagnostics, definition, references, hover, completion, symbols, rename, signature help
- Lightweight navigation when LSP is off (`ryunix.enableNavigation`)
- CRA `jsconfig.json` for editor project context (`paths` for `@unsetsoft/ryunixjs`)
- LSP project root: `jsconfig` / `ryunix.config.js` / workspace folder (not “most `.ryx` in one dir”)

## Not in scope (yet)

| Topic                            | Notes                                                 |
| :------------------------------- | :---------------------------------------------------- |
| MDX in editor                    | Build-time only                                       |
| Full Ryunix-specific typechecker | LSP reuses TS; some Ryunix conventions are heuristics |
| Inlay hints server/client        | Build plugin territory                                |

## Future

| Feature                                      | Notes                                                |
| :------------------------------------------- | :--------------------------------------------------- |
| Dedicated `ryunix-language-server`           | Ryunix-aware rules beyond TS+jsxFactory              |
| Semantic tokens for server/client boundaries | Needs router metadata or annotations                 |
| Official formatter                           | Prettier `*.ryx` override remains the practical path |

Run `pnpm --filter ./packages/ryunix-vscode run test` when editing TextMate grammar.
