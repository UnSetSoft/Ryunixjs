# Create Ryunix App: CLI and helpers

> **Language / Idioma:** [English](./cli-and-helpers.md) ·
> [Español](../../es/cra/cli-y-ayudantes.md)

Entry point for `@unsetsoft/cra`: arguments, interactive prompts, and modules
under `packages/cra/src/`. Package overview:
[package-overview.md](./package-overview.md).

---

## Table of contents

- [Create Ryunix App: CLI and helpers](#create-ryunix-app-cli-and-helpers)
  - [Table of contents](#table-of-contents)
  - [Entry: `cli.ts`](#entry-clits)
  - [Engine: `create-app.ts`](#engine-create-appts)
  - [Helpers (`src/helpers/`)](#helpers-srchelpers)
  - [Running the CLI in the monorepo](#running-the-cli-in-the-monorepo)

---

## Entry: `cli.ts`

Published as `src/cli.js` (TypeScript emit). Uses **Commander** for flags and
**prompts** when options are missing.

### Positional argument

| Argument | Description |
| :------- | :------------ |
| `[directory]` | Project folder name or path. Prompted if omitted. |

### Flags

| Flag | Effect |
| :--- | :----- |
| `-v, --version` | CRA package version |
| `-h, --help` | Help text |
| `--canary` | Canary channel for Ryunix dependencies |
| `--latest` | Latest channel (default when channel is not prompted) |
| `--tailwind` | Tailwind template |
| `--eslint` | ESLint template |
| `--vscode` | Writes `.vscode/extensions.json` recommending the Ryunix extension |
| `--compiler <swc\|babel>` | Compiler in `ryunix.config.js` (default `swc`) |

Without `--canary` or `--latest`, the CLI asks for the channel. Same for
Tailwind, ESLint, and VS Code unless you pass the flags above.

It then calls `createApp()` with `appPath`, `appName` (directory basename),
`channel`, `compiler`, `tailwind`, `eslint`, and `vscode`.

---

## Engine: `create-app.ts`

Exported function `createApp(options: CreateAppOptions)`.

### Steps

1. **Resolve path** — `path.resolve(appPath)`; create the folder if missing.
2. **Validate empty** — `isFolderEmpty()`; exits with code 1 on conflicts.
3. **Pick template** — See table in
   [template-generation.md](./template-generation.md).
4. **Copy** — `copyRecursiveSync(templateDir, root)`.
5. **Rename `gitignore`** — Template file `gitignore` becomes `.gitignore` (npm
   publish dotfile workaround).
6. **`package.json`** — Sets `name`, `version`, `private`; queries the registry
   (`npm view`, `yarn info`, or `pnpm view` from detected package manager) for
   `@unsetsoft/ryunixjs` and `@unsetsoft/ryunix-presets` at `latest` or `canary`;
   adds Tailwind or ESLint devDependencies when needed.
7. **`ryunix.config.js`** — If the template has `const RyunixSettings = {`,
   inserts `compiler: 'swc'|'babel'` into the object.
8. **VS Code** — If `vscode`, writes `.vscode/extensions.json` with
   `unsetsoft.ryunixjs`.
9. **Git** — Optional `tryGitInit(root)` (`main` branch, initial commit).
10. **Final message** — Prints `cd`, `install`, and `run dev` (does not run
    install).

### Version resolution

```text
npm view @unsetsoft/ryunixjs@<latest|canary> version
npm view @unsetsoft/ryunix-presets@<latest|canary> version
```

On failure, the literal tag (`latest` / `canary`) is used and a warning is
shown. Resolved versions are written with a `^` prefix in
`dependencies` / `devDependencies`.

### Exported types

- `RyunixChannel`: `'Latest' | 'Canary'`
- `RyunixCompiler`: `'swc' | 'babel'`
- `CreateAppOptions`: `createApp` parameters

---

## Helpers (`src/helpers/`)

| Module | Function | Role |
| :----- | :------- | :--- |
| `copy.ts` | `copyRecursiveSync(src, dest)` | Copies template tree; skips `node_modules`, `dist`, `.ryunix` |
| `get-pkg-manager.ts` | `getPkgManager()` | Reads `npm_config_user_agent` → `npm` \| `yarn` \| `pnpm` \| `bun` |
| `is-folder-empty.ts` | `isFolderEmpty(root, name)` | Allows only “safe” files (`.git`, `LICENSE`, etc.) |
| `git.ts` | `tryGitInit(root)` | `git init`, `main` branch, `add -A`, initial commit; rolls back on failure |
| `install.ts` | `install(pm, cwd)` | Runs package manager `install` quietly; **not** called by `create-app` today |

---

## Running the CLI in the monorepo

From the monorepo root (after `pnpm --filter @unsetsoft/cra build` if you
changed `.ts`):

```bash
node packages/cra/src/cli.js ../_cra/my-test-app --latest --tailwind
```

See also [automated testing](../guides/automated-testing.md) and
[local integration app](../guides/local-integration-app.md).

TypeScript maintenance:

```bash
pnpm --filter @unsetsoft/cra typecheck
pnpm --filter @unsetsoft/cra build
```
