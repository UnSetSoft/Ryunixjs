<!-- markdownlint-disable MD033 MD041 MD013 -->

<p align="center">
  <img src="https://raw.githubusercontent.com/UnSetSoft/Ryunixjs/canary/assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">@unsetsoft/ryunix-presets</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunix-presets">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunix-presets.svg?style=flat-square" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunix-presets/v/canary">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunix-presets/canary.svg?style=flat-square&label=canary" alt="canary version" />
  </a>
</p>

## <!-- markdownlint-enable MD013 -->

## 🛠️ The Tooling Backbone

`@unsetsoft/ryunix-presets` is the central package managing the build system of
RyunixJS. It abstracts the complexity of Webpack, Babel, and specialized
loaders, providing a unified and optimized development experience.

### Key Capabilities

- **Unified Webpack Config**: Handles dual compilation for SSR and Browser

  environments.

- **RSC & Server Actions**: Includes native loaders for React-like Server

  Components and Actions.

- **Advanced Loaders**: Pre-configured support for MDX, SASS, PostCSS, and

  optimized assets.

- **SSG Engine**: Integrated plugins for static site generation and

  prerendering.

## 🚀 Installation

```bash
npm install @unsetsoft/ryunix-presets
```

## ⚙️ Configuration (`ryunix.config.js`)

RyunixJS projects are configured via a `ryunix.config.js` (or `.cjs`) file at
the root.

### Core Options

| Option     | Type              | Default     | Description                                   |
| :--------- | :---------------- | :---------- | :-------------------------------------------- |
| `ssr`      | `boolean`         | `true`      | Enables Server-Side Rendering.                |
| `mdx`      | `boolean`         | `false`     | Enables native MDX support.                   |
| `rootDir`  | `string`          | `"src"`     | The directory containing your source code.    |
| `buildDir` | `string`          | `".ryunix"` | The output directory for builds.              |
| `port`     | `number`          | `3000`      | Dev server port.                              |
| `favicon`  | `string\|boolean` | `true`      | Path to favicon or boolean to enable default. |
| `debug`    | `boolean`         | `false`     | Enable verbose logging for debugging.         |

### Server & Security

- **`server.csp`**: `boolean` - Enable Content Security Policy.
- **`server.cors`**: Configure CORS for the dev server (`enabled`, `origin`,

  `methods`, etc.).

### Advanced Webpack Customization

You can extend the underlying Webpack configuration via the `webpack` key:

```javascript
module.exports = {
  webpack: {
    resolve: {
      alias: {
        '@components': 'src/components',
      },
    },
    plugins: [
      /* Custom Webpack Plugins */
    ],
    module: {
      rules: [
        /* Custom Rules */
      ],
    },
  },
}
```

### Linter Configuration

Control how ESLint behaves during development:

```javascript
module.exports = {
  eslint: {
    files: ['src/**/*.ryx'],
    rules: {
      'no-console': 'warn',
    },
  },
}
```

## 🏗️ Build Pipelines

The presets package manages three main pipelines:

1. **Client Pipeline**: Compiles assets for the browser with code splitting and

   HMR.

2. **Server Pipeline**: Compiles server-side logic and SSG renderers for Node.js

   environments.

3. **SSG/Prerender**: Unified logic to generate static HTML during the build

   phase.

## 📄 License

RyunixJS is [MIT Licensed](file:///e:/proyects/Ryunixjs/LICENSE).
