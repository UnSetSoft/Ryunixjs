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

Los proyectos RyunixJS se configuran con un archivo `ryunix.config.js` (o `.cjs`)
en la raíz del proyecto. El CLI lo carga con `require()` de Node (ver
`webpack/utils/settingfile.cjs`).

**TypeScript / editor:** los tipos están en `webpack/config.d.ts` (export
`RyunixUserConfig`). En apps con config tipada, instala
`@unsetsoft/ryunix-presets` como `devDependency`.

```javascript
/** @type {import('@unsetsoft/ryunix-presets').RyunixUserConfig} */
export default {
  ssr: true,
  port: 3000,
}
```

### Opciones principales

| Opción       | Tipo                 | Por defecto | Descripción                                           |
| :----------- | :------------------- | :---------- | :---------------------------------------------------- |
| `ssr`        | `boolean`            | `true`      | Server-Side Rendering.                                |
| `mdx`        | `boolean`            | `false`     | Páginas y loaders MDX.                                |
| `env`        | `Record<string, …>`  | `{}`        | Variables expuestas al bundle del cliente.            |
| `rootDir`    | `string`             | `"src"`     | Raíz de código si `app/` no está en la raíz.          |
| `buildDir`   | `string`             | `".ryunix"` | Directorio de salida del build.                       |
| `port`       | `number`             | `3000`      | Puerto del servidor de desarrollo.                    |
| `proxy`      | `array \| object`    | `[]`        | `devServer.proxy` de Webpack.                         |
| `favicon`    | `string \| boolean`  | `true`      | Ruta del favicon o `public/favicon.png` por defecto.  |
| `compiler`   | `"swc" \| "babel"`   | `"swc"`     | Transpilador de fuentes de la app.                     |
| `debug`      | `boolean`            | `false`     | Logs detallados de Ryunix / webpack.                  |

### Servidor y seguridad

| Opción                    | Tipo      | Por defecto | Descripción                         |
| :------------------------ | :-------- | :---------- | :---------------------------------- |
| `server.csp`              | `boolean` | `false`     | Content-Security-Policy.            |
| `server.cors.enabled`     | `boolean` | `false`     | Activa cabeceras CORS.              |
| `server.cors.origin`      | `string`  | `"*"`       | `Access-Control-Allow-Origin`.      |
| `server.cors.methods`     | `string`  | …           | Métodos HTTP permitidos.            |
| `server.cors.headers`     | `string`  | …           | Cabeceras de petición permitidas.   |
| `server.cors.credentials` | `boolean` | `false`     | Credenciales en CORS.               |

### Webpack (`webpack`)

| Clave                               | Descripción                                              |
| :---------------------------------- | :------------------------------------------------------- |
| `webpack.production`                | Forzar modo producción (suele usarse `RYUNIX_MODE`).     |
| `webpack.target`                    | `target` de Webpack (por defecto `"web"`).              |
| `webpack.resolve.alias`             | Alias de módulos.                                        |
| `webpack.resolve.fallback`          | Polyfills Node en el cliente.                            |
| `webpack.resolve.extensions`        | Extensiones extra de resolución.                         |
| `webpack.plugins`                   | Plugins adicionales (compilador cliente).                |
| `webpack.module.rules`              | Reglas extra (se fusionan con las de Ryunix).            |
| `webpack.externals`                 | Externals del cliente.                                   |
| `webpack.experiments.lazyCompilation` | Compilación perezosa (por defecto `false`).            |
| `webpack.devServer.allowedHosts`    | Hosts permitidos en dev (por defecto `"auto"`).          |

### Legacy / SSG (`legacy`)

Para el router de páginas y prerender por config. Con `app/`, prefiere metadata
en `layout.ryx` / `page.ryx`.

| Clave                             | Descripción                                                |
| :-------------------------------- | :--------------------------------------------------------- |
| `legacy.seo.pageLang`             | Atributo `lang` del HTML (por defecto `"en"`).             |
| `legacy.seo.title`                | Título por defecto del documento.                          |
| `legacy.seo.meta`                 | Meta estáticas (no mezclar con SSG dinámico).              |
| `legacy.template`                 | Plantilla HTML personalizada o `false`.                    |
| `legacy.ssg.sitemap.enable`       | Generar `sitemap.xml` en build.                            |
| `legacy.ssg.sitemap.baseURL`      | URL canónica del sitio.                                    |
| `legacy.ssg.sitemap.settings`     | `changefreq`, `priority` por ruta.                         |
| `legacy.ssg.sitemap.prerender`    | Rutas si no hay manifiesto file-based.                     |

Las claves antiguas (`experimental.*`, `static.*`, `webpack.root`, etc.) siguen
funcionando pero muestran aviso en terminal; ver `webpack/utils/config.cjs`.

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
