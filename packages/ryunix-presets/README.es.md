<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/UnSetSoft/Ryunixjs/canary/assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">@unsetsoft/ryunix-presets</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunix-presets">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunix-presets.svg?style=flat-square" alt="versión npm" />
  </a>
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunix-presets/v/canary">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunix-presets/canary.svg?style=flat-square&label=canary" alt="versión canary" />
  </a>
</p>

## <!-- markdownlint-enable MD013 -->

## 🛠️ La columna vertebral del tooling

`@unsetsoft/ryunix-presets` es el paquete central que gestiona el sistema de build de
RyunixJS. Abstrae la complejidad de Webpack, Babel y loaders especializados, ofreciendo
una experiencia de desarrollo unificada y optimizada.

### Capacidades principales

- **Configuración Webpack unificada**: compilación dual para entornos SSR y navegador.

- **RSC y Server Actions**: loaders nativos para Server Components y Actions al estilo

  React.

- **Loaders avanzados**: soporte preconfigurado para MDX, SASS, PostCSS y assets

  optimizados.

- **Motor SSG**: plugins integrados para generación de sitios estáticos y

  prerenderizado.

## 🚀 Instalación

```bash
npm install @unsetsoft/ryunix-presets
```

## ⚙️ Configuración (`ryunix.config.js`)

Los proyectos RyunixJS se configuran con un archivo `ryunix.config.js` (o `.cjs`) en la

raíz.

### Opciones principales

| Opción     | Tipo              | Por defecto | Descripción                                        |
| :--------- | :---------------- | :---------- | :------------------------------------------------- |
| `ssr`      | `boolean`         | `true`      | Habilita Server-Side Rendering.                    |
| `mdx`      | `boolean`         | `false`     | Habilita soporte MDX nativo.                       |
| `rootDir`  | `string`          | `"src"`     | Directorio del código fuente.                    |
| `buildDir` | `string`          | `".ryunix"` | Directorio de salida del build.                  |
| `port`     | `number`          | `3000`      | Puerto del servidor de desarrollo.               |
| `favicon`  | `string\|boolean` | `true`      | Ruta del favicon o booleano para el predeterminado. |
| `debug`    | `boolean`         | `false`     | Registro detallado para depuración.                |

### Servidor y seguridad

- **`server.csp`**: `boolean` — activa Content Security Policy.
- **`server.cors`**: configura CORS en el servidor de desarrollo (`enabled`, `origin`,

  `methods`, etc.).

### Personalización avanzada de Webpack

Puedes extender la configuración de Webpack con la clave `webpack`:

```javascript
module.exports = {
  webpack: {
    resolve: {
      alias: {
        '@components': 'src/components',
      },
    },
    plugins: [
      /* Plugins personalizados */
    ],
    module: {
      rules: [
        /* Reglas personalizadas */
      ],
    },
  },
}
```

### Configuración del linter

Controla el comportamiento de ESLint en desarrollo:

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

## 🏗️ Pipelines de build

El paquete presets gestiona tres pipelines principales:

1. **Pipeline cliente**: compila assets para el navegador con code splitting y HMR.

2. **Pipeline servidor**: compila lógica de servidor y renderizadores SSG para Node.js.

3. **SSG / prerender**: lógica unificada para generar HTML estático en la fase de build.

## 📄 Licencia

RyunixJS tiene [licencia MIT](../../LICENSE).
