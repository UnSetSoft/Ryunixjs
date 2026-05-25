<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/UnSetSoft/Ryunixjs/canary/assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">@unsetsoft/cra</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/cra">
    <img src="https://img.shields.io/npm/v/@unsetsoft/cra.svg?style=flat-square" alt="npm version" />
  </a>
</p>

## <!-- markdownlint-enable MD013 -->

## 🚀 Create Ryunix App

The official scaffolder for RyunixJS applications. Create modern,
high-performance web applications with a guided interactive experience and
optimized default configurations.

## 🛠️ Usage

You can start the interactive setup simply by running:

```bash
npx @unsetsoft/cra@latest
```

Or specify the project name directly:

```bash
npx @unsetsoft/cra@latest my-ryunix-app
```

## ✨ Interactive Experience

The CLI will guide you through several choices to customize your project:

1. **Project Name**: The directory name for your new application.
2. **Release Channel**: Choose between **Latest** (stable) or **Canary**

   (cutting edge/experimental features).

3. **Tailwind CSS**: Optional automatic initialization and configuration of

   Tailwind CSS.

4. **ESLint**: Pre-configured linting rules optimized for Ryunix development.
5. **VS Code Integration**: Automatic configuration for the Ryunix VS Code

   Extension workspace settings.

## 🚩 Command Line Flags

For more control, you can use the following flags:

| Flag            | Description                                                                               |
| :-------------- | :---------------------------------------------------------------------------------------- |
| `-v, --version` | Output the current version of the CLI.                                                    |
| `-h, --help`    | Display the help message.                                                                 |
| `--canary`      | Use the Canary channel for Ryunix dependencies.                                           |
| `--latest`      | Use the Latest channel for Ryunix dependencies (default).                               |
| `--tailwind`    | Initialize with Tailwind CSS configuration.                                               |
| `--eslint`      | Initialize with ESLint configuration.                                                     |
| `--vscode`      | Add VS Code settings recommending [`unsetsoft.ryunixjs`](../ryunix-vscode) (source in monorepo). |

## 🏗️ What's Inside?

Every project scaffolded with `cra` comes pre-configured with:

- **Optimization**: Webpack-based build system with optimized bundles.
- **SSR Ready**: Foundations for Server-Side Rendering.
- **Modular Structure**: Clean directory layout (`app/`, `src/`, `public/`).
- **Configuration**: Ready-to-use `ryunix.config.js`.

## 📄 License

RyunixJS is [MIT Licensed](../../LICENSE).
