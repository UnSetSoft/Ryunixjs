# Contributing to RyunixJS

Thank you for your interest in contributing to RyunixJS! We are excited to see the community grow and appreciate any help in making RyunixJS the best standalone framework it can be.

## 🌈 Philosophy

RyunixJS aims to provide a manageable, standalone alternative for building web applications without being tied to a specific standard or external React dependency. We value performance, modularity, and a developer-friendly experience.

## 🐛 Reporting Bugs

If you find a bug, please [open an issue](https://github.com/UnSetSoft/Ryunixjs/issues) on GitHub. Include as much detail as possible:
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

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/UnSetSoft/Ryunixjs.git
    cd Ryunixjs
    ```
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Run in development mode**:
    ```bash
    pnpm run dev
    ```

### Key Scripts
- `pnpm run build`: Build all packages.
- `pnpm run test`: Run tests across the monorepo.
- `pnpm run lint`: Check for code style issues.
- `pnpm run format`: Format code with Prettier.

## 🌿 Branching Strategy

To keep the development flow organized, please use the following naming convention for your branches:

- **Format**: `gh/[your-username]/[descriptive-name]` (e.g., `gh/neyunse/fix-hook-bug`)
- **Target**: All changes must target the **`canary`** branch.

## 📝 Commit & PR Guidelines

- **Commit Messages**: Keep them simple, descriptive, and in English.
- **Version Bumps**: **Do not** manually change version numbers in `package.json`. These are handled during the release cycle.
- **Link Issues**: In your PR description, use "Closes #123" to link and automatically close related issues.
- **Verification**: Ensure tests and linting pass (`pnpm run test` and `pnpm run lint`) before submitting.

## 🚀 Release Flow

1.  **Canary**: Features and fixes land here for initial evaluation and testing.
2.  **Stable**: Final releases are cut from stable branches after thorough verification in canary.

## 📄 License

By contributing to RyunixJS, you agree that your contributions will be licensed under its [MIT License](LICENSE).

---

Happy coding! 🚀
