# Contributing to RyunixJS

> **Language / Idioma:** [English](./CONTRIBUTING.md) ·
> [Español](./CONTRIBUTING.es.md)

Thank you for your interest in contributing to RyunixJS! We are excited to see
the community grow and appreciate any help in making RyunixJS the best
standalone framework it can be.

## 🌈 Philosophy

RyunixJS aims to provide a manageable, standalone alternative for building web
applications without being tied to a specific standard or external React
dependency. We value performance, modularity, and a developer-friendly
experience.

## 🐛 Reporting Bugs

If you find a bug, please
[open an issue](https://github.com/UnSetSoft/Ryunixjs/issues) on GitHub. Include
as much detail as possible:

- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Environment details (Node version, OS, Browser).

## ✨ Proposing Enhancements

Got an idea for a new feature?

1. Open an issue to discuss your proposal first.
2. Once the idea is vetted, you'll be encouraged to submit a Pull Request.

## 🛠️ Development Setup

This project is a monorepo managed with **pnpm** and **Turbo**.

### Requirements

- **Node.js**: >= 22.x
- **pnpm**: Latest version (v10+ highly recommended)

### Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/UnSetSoft/Ryunixjs.git
   cd Ryunixjs
   ```

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

1. **Run in development mode**:

   ```bash
   pnpm run dev
   ```

### Key Scripts

| Command                   | Description                                                                 |
| :------------------------ | :-------------------------------------------------------------------------- |
| `pnpm run dev`            | Run all packages in development mode using Turbo.                           |
| `pnpm run build`          | Build all packages in the monorepo.                                         |
| `pnpm run test`           | Run the test suite across all packages.                                     |
| `pnpm run lint`           | Check for code style and linting issues.                                    |
| `pnpm run lint:md`        | Lint Markdown (`docs/`, root `*.md`, package READMEs).                      |
| `pnpm run lint:md:fix`    | Auto-fix Markdown (`markdownlint-cli2 --fix` + Prettier).                   |
| `pnpm run lint:fix`       | Automatically fix linting and formatting issues.                            |
| `pnpm run format`         | Format all files using Prettier.                                            |
| `pnpm run clean`          | Clean build artifacts and remove `node_modules`.                            |
| `pnpm run run:web`        | Run the Webpack test project in development mode.                           |
| `pnpm run release:canary` | Prepare and release the Canary version of the core library.                 |
| `pnpm run publish:canary` | Publish all packages (excluding tests and devtools) with the `@canary` tag. |

## 🌿 Branching Strategy

To keep the development flow organized, please use the following naming
convention for your branches:

- **Format**: `gh/[your-username]/[descriptive-name]` (e.g.,

  `gh/neyunse/fix-hook-bug`)

- **Target**: All changes must target the **`canary`** branch.

## 📝 Commit & PR Guidelines

- **Commit Messages**: Keep them simple, descriptive, and in English.
- **Version Bumps**: **Do not** manually change version numbers in

  `package.json`. These are handled during the release cycle.

- **Link Issues**: In your PR description, use "Closes #123" to link and

  automatically close related issues.

- **Verification**: Ensure tests and linting pass (`pnpm run test` and

  `pnpm run lint`) before submitting. Per-package details:
  [docs/en/guides/automated-testing.md](docs/en/guides/automated-testing.md).

## 🚀 Release Flow

1. **Canary**: Features and fixes land here for initial evaluation and testing.
2. **Stable**: Final releases are cut from stable branches after thorough

   verification in canary.

### GitHub Actions (CI & npm publish)

- **CI** (`.github/workflows/ci.yml`): builds only `@unsetsoft/ryunixjs` (Rollup).
  `@unsetsoft/ryunix-presets` has no build step (ships `webpack/` as source).
  Also runs Jest, ESLint, Markdown lint, Prettier, and a CRA smoke build.
- **Release** (`.github/workflows/release.yml`): **npm Trusted Publishing (OIDC)**
  with provenance. No `NPM_TOKEN` secret.

#### npm Trusted Publisher (one-time per package)

Configure on [npmjs.com](https://www.npmjs.com/) → package → **Settings** →
**Trusted publishing** for each published package:

| Package                     | `repository.directory`    |
| :-------------------------- | :------------------------ |
| `@unsetsoft/ryunixjs`       | `packages/core`           |
| `@unsetsoft/ryunix-presets` | `packages/ryunix-presets` |
| `@unsetsoft/cra`            | `packages/cra`            |

| Field             | Value                                               |
| :---------------- | :-------------------------------------------------- |
| Provider          | GitHub Actions                                      |
| Repository        | `UnSetSoft/Ryunixjs`                                |
| Workflow filename | `release.yml`                                       |
| Environment       | _(leave empty unless you add a GitHub Environment)_ |

Recommended after verifying OIDC publish: **Publishing access** → _Require 2FA and
disallow tokens_ (revoke old automation tokens).

Release workflow: **Actions → Release → Run workflow** with **dry-run** until
versions in `package.json` are ready. Tag `v*` triggers a real publish (`canary`
in the tag name → npm tag `canary`, otherwise `latest`).

## 📄 License

By contributing to RyunixJS, you agree that your contributions will be licensed
under its [MIT License](LICENSE).

---

Happy coding! 🚀
