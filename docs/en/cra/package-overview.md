# `packages/cra` — `@unsetsoft/cra`

Official project scaffolder (`npx @unsetsoft/cra`). Interactive CLI that copies
templates, resolves npm versions (latest / canary), and optionally sets up
Tailwind, ESLint, and VS Code workspace recommendations.

---

## Role in the monorepo

| Aspect | Detail |
| :----- | :----- |
| **Consumer** | Developers creating new Ryunix apps (not a runtime dependency) |
| **Templates** | `templates/` (`ryunix-base`, variants with Tailwind, etc.) |
| **VS Code** | `--vscode` writes `.vscode/extensions.json` for `unsetsoft.ryunixjs` |

---

## Layout

```text
packages/cra/
├── src/
│   ├── cli.js           # Commander entry (`npx @unsetsoft/cra`)
│   └── create-app.js    # Prompts, copy, dependency resolution
├── templates/           # Starter projects (app/, ryunix.config.js, …)
└── package.json
```

---

## Commands

```bash
# Run the CLI locally from the monorepo
pnpm --filter @unsetsoft/cra run dev

# End users
npx @unsetsoft/cra@latest my-app
npx @unsetsoft/cra@latest my-app --canary --tailwind --eslint --vscode
```

Publish (maintainers): `pnpm run cra:release` or `pnpm run cra:nightly` at the
monorepo root.

---

## Related docs

| Topic | Document |
| :---- | :------- |
| CLI & helpers | [cli-and-helpers.md](./cli-and-helpers.md) |
| Template generation | [template-generation.md](./template-generation.md) |
| VS Code extension | [../ryunix-vscode/package-overview.md](../ryunix-vscode/package-overview.md) |
