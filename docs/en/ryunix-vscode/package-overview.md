# `packages/ryunix-vscode` — VS Code extension

Source for the **RyunixJS** editor extension published on the Visual Studio
Marketplace as
[`unsetsoft.ryunixjs`](https://marketplace.visualstudio.com/items?itemName=unsetsoft.ryunixjs).

---

## Role in the monorepo

| Aspect | Detail |
| :----- | :----- |
| **Consumer** | Developers editing `.ryx` files in VS Code |
| **Not an npm runtime dependency** | Apps use `@unsetsoft/ryunixjs`; this package only affects the editor |
| **CRA integration** | `create-app.js` can write `.vscode/extensions.json` recommending `unsetsoft.ryunixjs` when `--vscode` is set |

---

## Layout

```text
packages/ryunix-vscode/
├── package.json              # Extension manifest (name must stay "ryunixjs" for Marketplace ID)
├── syntaxes/                 # TextMate grammar (JavaScript + JSX-like .ryx)
├── snippets/
├── language-configuration.json
├── tags-language-configuration.json
├── icon.png, logo-*.svg
└── .vscode/launch.json       # F5 Extension Development Host
```

The `package.json` field `"name": "ryunixjs"` is intentional: Marketplace ID is
`{publisher}.{name}` → `unsetsoft.ryunixjs`.

---

## Commands

From the repository root (after `pnpm install`):

```bash
# Package a .vsix for local install or CI artifacts
pnpm --filter ./packages/ryunix-vscode run build

# Publish to Visual Studio Marketplace (maintainers, PAT required)
pnpm --filter ./packages/ryunix-vscode run publish:marketplace
```

Local install of a built `.vsix`:

```bash
code --install-extension packages/ryunix-vscode/ryunixjs-1.0.2.vsix
```

---

## Development workflow

1. Open `packages/ryunix-vscode` in VS Code (or the full monorepo).
2. Press **F5** (launch config **Extension**) to open a window with the
   extension loaded.
3. Open any `.ryx` file (e.g. from `test/webpack` after `pnpm run setup:web` on
   branches that include it).
4. Edit grammars or snippets; reload the Extension Development Host to test.

---

## Release notes

- Version and changelog live in `packages/ryunix-vscode/package.json` and
  `CHANGELOG.md`.
- Root `pnpm publish:all` **excludes** this package (Marketplace-only, like
  `ryunix-devtools` on npm).

---

## Related docs

| Topic | Document |
| :---- | :------- |
| CRA `--vscode` flag | [../cra/cli-and-helpers.md](../cra/cli-and-helpers.md) |
| Chrome DevTools extension | `packages/ryunix-devtools` (browser debugging, separate from VS Code) |
