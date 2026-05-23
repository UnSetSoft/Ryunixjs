<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

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
the project root. The CLI loads it with Node `require()` (see
`webpack/utils/settingfile.cjs`).

**TypeScript / editor support:** types ship in `webpack/config.d.ts` (export
`RyunixUserConfig`). Install `@unsetsoft/ryunix-presets` as a devDependency in
apps that use a typed config.

```javascript
/** @type {import('@unsetsoft/ryunix-presets').RyunixUserConfig} */
export default {
  ssr: true,
  port: 3000,
}
```

### Core options

| Option       | Type                 | Default     | Description                                      |
| :----------- | :------------------- | :---------- | :----------------------------------------------- |
| `ssr`        | `boolean`            | `true`      | Server-side rendering.                           |
| `mdx`        | `boolean`            | `false`     | MDX loaders and pages.                           |
| `env`        | `Record<string, …>`  | `{}`        | Values exposed to the client bundle.             |
| `rootDir`    | `string`             | `"src"`     | Source root when `app/` is not at project root.  |
| `buildDir`   | `string`             | `".ryunix"` | Build output directory.                          |
| `port`       | `number`             | `3000`      | Dev server port.                                 |
| `proxy`      | `array \| object`    | `[]`        | Webpack `devServer.proxy`.                       |
| `favicon`    | `string \| boolean`  | `true`      | Favicon path or default `public/favicon.png`.    |
| `compiler`   | `"swc" \| "babel"`   | `"swc"`     | Transpiler for app sources.                      |
| `debug`      | `boolean`            | `false`     | Verbose Ryunix / webpack logs.                   |

### Server and security

| Option                 | Type      | Default | Description                    |
| :--------------------- | :-------- | :------ | :----------------------------- |
| `server.csp`           | `boolean` | `false` | Content-Security-Policy.       |
| `server.cors.enabled`  | `boolean` | `false` | Enable CORS headers.           |
| `server.cors.origin`   | `string`  | `"*"`   | `Access-Control-Allow-Origin`. |
| `server.cors.methods`  | `string`  | …       | Allowed HTTP methods.          |
| `server.cors.headers`  | `string`  | …       | Allowed request headers.       |
| `server.cors.credentials` | `boolean` | `false` | Allow credentials.          |

### Webpack overrides (`webpack`)

| Key                         | Description                                                |
| :-------------------------- | :--------------------------------------------------------- |
| `webpack.production`        | Force production mode (usually `RYUNIX_MODE=production`).  |
| `webpack.target`            | Webpack `target` (default `"web"`).                        |
| `webpack.resolve.alias`     | Module aliases.                                            |
| `webpack.resolve.fallback`  | Node polyfills for the client bundle.                      |
| `webpack.resolve.extensions`| Extra resolve extensions.                                  |
| `webpack.plugins`           | Additional Webpack plugins (client compiler).              |
| `webpack.module.rules`      | Extra module rules (merged with Ryunix defaults).          |
| `webpack.externals`         | Client externals.                                          |
| `webpack.experiments.lazyCompilation` | Lazy compilation (default `false`).            |
| `webpack.devServer.allowedHosts` | Dev server host allowlist (default `"auto"`).       |

### Legacy / SSG (`legacy`)

Used with the pages router and config-driven prerender. Prefer App Router
metadata when using `app/`.

| Key                              | Description                                   |
| :------------------------------- | :-------------------------------------------- |
| `legacy.seo.pageLang`            | HTML `lang` (default `"en"`).                 |
| `legacy.seo.title`               | Default document title.                       |
| `legacy.seo.meta`                | Static meta tags (conflicts with dynamic SSG). |
| `legacy.template`                | Custom HTML template path or `false`.         |
| `legacy.ssg.sitemap.enable`      | Generate `sitemap.xml` on build.              |
| `legacy.ssg.sitemap.baseURL`       | Canonical site URL for the sitemap.           |
| `legacy.ssg.sitemap.settings`      | `changefreq`, `priority` per route.           |
| `legacy.ssg.sitemap.prerender`   | Route list when no file-based manifest exists. |

Deprecated top-level keys (`experimental.*`, `static.*`, `webpack.root`, etc.)
still work but log a yellow warning; see `webpack/utils/config.cjs`.

### Advanced Webpack customization

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

RyunixJS is [MIT Licensed](../../LICENSE).
