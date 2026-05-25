<!-- markdownlint-disable MD013 MD060 -->

# `packages/ryunix-presets` — `@unsetsoft/ryunix-presets`

**Tooling de build y CLI** para aplicaciones Ryunix: comando `ryunix`, configuración
Webpack dual (cliente + servidor), App Router por archivos, SSG, rutas API,
loaders para límites server/client y Server Actions. Las apps **no** importan
este paquete en runtime del navegador; lo usan solo en `devDependencies` y en
scripts `package.json`.

**Lectura recomendada después:** [cli-y-arranque.md](./cli-y-arranque.md) y
[enrutamiento-y-ssg.md](./enrutamiento-y-ssg.md).

---

## Rol en el monorepo

| Aspecto | Detalle |
| :------ | :------ |
| **Quién lo usa** | Apps generadas por CRA, plantillas y `test/webpack` |
| **Peer** | `@unsetsoft/ryunixjs` — runtime que Webpack empaqueta o externaliza |
| **Distribución** | Código fuente en `webpack/` (sin bundle previo del preset en CI) |
| **Binario** | `ryunix` → `webpack/bin/index.mjs` |

```mermaid
flowchart LR
  Dev[ryunix dev]
  Build[ryunix build]
  Start[ryunix start]
  Dev --> WDS[webpack-dev-server]
  Build --> Out[.ryunix/static + server]
  Start --> Prod[prod.server HTTP]
  Out --> Start
  WDS --> Core[@unsetsoft/ryunixjs]
  Prod --> Core
```

---

## Estructura del paquete

```text
packages/ryunix-presets/
├── package.json              # bin "ryunix", export "./webpack"
└── webpack/
    ├── bin/
    │   ├── index.mjs         # CLI: dev | build | start | lint | customHtml
    │   ├── compiler.mjs      # webpack en producción
    │   ├── dev.server.mjs    # webpack-dev-server + middlewares Ryunix
    │   ├── prod.server.mjs   # Servidor HTTP tras build
    │   └── prerender.mjs     # SSG post-build
    ├── utils/                # Plugins y lógica Ryunix (no carpeta plugins/)
    │   ├── appRouterPlugin.mjs
    │   ├── ApiRouterPlugin.mjs
    │   ├── ssgPlugin.mjs     # RyunixRoutesPlugin (legacy pages/)
    │   ├── ssg.mjs
    │   ├── ssrDevHandler.mjs
    │   ├── apiHandler.mjs
    │   ├── config.cjs        # Defaults + fusión ryunix.config.js
    │   └── …
    ├── loaders/
    │   ├── ryunix-rsc-loader.mjs
    │   └── ryunix-server-action-loader.mjs
    ├── template/index.html
    ├── webpack.config.mjs    # Cliente + servidor, reglas, plugins Webpack
    ├── eslint.config.mjs     # ESLint para apps (probe ryunix)
    └── index.js              # export default config
```

### Plugins Ryunix (`utils/`)

| Módulo | Cuándo actúa | Qué genera o hace |
| :----- | :----------- | :---------------- |
| **AppRouterPlugin** | `beforeCompile` si existe `app/` | Escanea `app/**/*.ryx`, detecta server/client, escribe `.ryunix/server/app/app-router.js`, `app-router-server.js`, `main.ryx`, `cache/ssg/routes.json` |
| **ApiRouterPlugin** | Compilación API | `app/api/**` → `.ryunix/server/api/**` (SWC) |
| **RyunixRoutesPlugin** | Legacy SSG | `pages/routes.ryx` → manifest SSG (si no hay solo App Router) |
| **ssrDevHandler** | `ryunix dev` | SSR de rutas HTML en desarrollo |
| **apiHandler** | dev y prod | Resuelve `/api/*` contra bundles API |

### Loaders

| Loader | Función |
| :----- | :------ |
| **ryunix-rsc-loader** | Filtra bloques `// @server` / `// @client` según target web vs node |
| **ryunix-server-action-loader** | Registra acciones en servidor; proxies `createActionProxy` en cliente |

### CLI `ryunix`

| Comando | Modo | Resumen |
| :------ | :--- | :------ |
| `dev` | `RYUNIX_MODE=development` | Webpack dev server, HMR, middleware SSR/API/actions |
| `build` | `production` | Limpia salidas, compila, prerender SSG si hay rutas |
| `start` | `production` | Sirve `.ryunix/static` (requiere build previo) |
| `lint` | — | ESLint sobre `**/*.ryx` y configs |
| `customHtml` | — | Copia plantilla HTML legacy a `public/` |

---

## Convenciones de una app Ryunix

### Carpeta `app/` (App Router)

Cada **carpeta** es un segmento de URL. Archivos reservados por segmento:

| Archivo | Rol |
| :------ | :-- |
| `index.ryx` | Página del segmento |
| `layout.ryx` | Layout anidado (`children`) |
| `loading.ryx` | UI de carga (Suspense) |
| `error.ryx` | Error boundary de ruta (el plugin busca `error.ryx`, no `errors.ryx`) |
| `*.server.ryx` / `*.client.ryx` | Convención de nombre para límite server/client |
| `// @server` / `// @client` | Directivas en el fuente |

**Heurísticas server vs client:** `export async default` → servidor; hooks
(`useStore`, `useEffect`, …) → cliente.

**Metadata:** `export const Metatags`, `frontmatter` (MDX) o `generateMetadata`.

**Dinámicas:** `[id]` → `:id`; `[...slug]` → catch-all.

**API:** `app/api/<nombre>/router.js` (o `route.js`, `endpoint.js`) → `/api/<nombre>`.

### Salida de build (`.ryunix/` por defecto)

| Ruta | Contenido |
| :--- | :-------- |
| `.ryunix/static/` | Bundle cliente, `index.html`, CSS, assets |
| `.ryunix/server/app/` | Routers generados, bundle servidor |
| `.ryunix/server/api/` | Handlers API compilados |
| `.ryunix/cache/` | Cache Webpack, manifest SSG |

**No editar a mano:** `app-router.js`, `main.ryx` generados.

### Configuración `ryunix.config.js`

Fusionada en `utils/config.cjs`: `buildDir`, `ssr` (default `true`), `compiler`
(`swc` | `babel`), flags MDX, legacy SSG, env, etc. Ver
[carga-de-configuracion.md](./carga-de-configuracion.md).

---

## Flujo dev → build → start

1. **`ryunix dev`:** valida config y `.env`, compila cliente (+ servidor si SSR),
   levanta dev server (puerto por defecto 3000), HMR y middlewares para API/SSR.
2. **`ryunix build`:** limpia `static` y partes de `server/app`, compila en
   producción, ejecuta prerender si `cache/ssg/routes.json` tiene rutas.
3. **`ryunix start`:** comprueba que exista `.ryunix/static`, sirve estáticos +
   API + SSR según lo generado.

---

## Comandos

En el directorio de una app:

```bash
pnpm run dev      # → ryunix dev
pnpm run build    # → ryunix build
pnpm run start    # → ryunix start
```

Desde la raíz del monorepo (lint del preset):

```bash
pnpm --filter @unsetsoft/ryunix-presets exec eslint webpack --max-warnings=0 --config ../../eslint.config.mjs
```

---

## Relación con otros paquetes

| Paquete | Relación |
| :------ | :------- |
| `core` | Runtime empaquetado o external; global `Ryunix` en cliente |
| `cra` | Instala `@unsetsoft/ryunix-presets` y scripts que invocan `ryunix` |
| `ryunix-vscode` | ESLint del preset valida `.ryx`; no dependencia del preset |

---

## Documentación en `docs/es/ryunix-presets/`

| Documento | Tema |
| :-------- | :--- |
| [cli-y-arranque.md](./cli-y-arranque.md) | Servidores dev/prod, variables de entorno |
| [carga-de-configuracion.md](./carga-de-configuracion.md) | `ryunix.config.js` |
| [enrutamiento-y-ssg.md](./enrutamiento-y-ssg.md) | App Router, SSG, SSR en dev |
| [enrutador-api.md](./enrutador-api.md) | Rutas `app/api/` |
| [loaders-webpack.md](./loaders-webpack.md) | RSC y Server Actions |
| [errores-por-archivo.md](./errores-por-archivo.md) | `error.ryx` y overlay |

Par en inglés: [docs/en/ryunix-presets/package-overview.md](../../en/ryunix-presets/package-overview.md).
