<!-- markdownlint-disable MD033 MD041 MD013 MD060 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

# Extensión Ryunix para VS Code

Soporte en VS Code para archivos `.ryx` de Ryunix: resaltado (JS + JSX),
snippets de Ryunix, autocompletado de hooks del core y valores por defecto del
workspace.

**ID en Marketplace:** `unsetsoft.ryunixjs`

## Instalar desde Marketplace

Busca **RyunixJS** en Extensiones de VS Code, o:

```bash
code --install-extension unsetsoft.ryunixjs
```

CRA añade `.vscode/extensions.json` y `.vscode/settings.json` con `--vscode`
(recomienda Ryunix + ESLint; Prettier si usas `--eslint`). Instala las
extensiones recomendadas cuando VS Code lo pida.

## Alcance

| Soportado en esta extensión                                                             | No soportado (otras herramientas)                                      |
| :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| `.ryx` como JS + JSX (TextMate)                                                         | MDX (`.mdx`) — validación en build con `@mdx-js/loader`                |
| **LSP** (diagnósticos, ir a definición, referencias, hover, rename) con `jsconfig.json` | TypeScript estricto / tipos de proyecto completos                      |
| ESLint vía `eslint.probe` / `eslint.validate` del workspace                             | `formatOnSave` empaquetado (usa Prettier en el proyecto)               |
| Emmet en modo `ryunix`                                                                  | Rutas API: plantillas usan `router.js`; snippets `.ryx` opcionales     |
| Snippets + completions (LSP o modo ligero sin LSP)                                      | Alias `@/` sin `paths` en `jsconfig` (copia los de `ryunix.config.js`) |

Completions por nombre de archivo (p. ej. plantilla de layout en `layout.ryx`) y
`frontmatter` como alias de `Metatags` en `extension.js`.

## Snippets (prefijos)

| Prefijo                        | Uso                                          |
| :----------------------------- | :------------------------------------------- |
| `ryx-page`                     | Página cliente (`Metatags` + export default) |
| `ryx-server-page`              | `index.ryx` servidor (`async` + `Metatags`)  |
| `ryx-layout`                   | Layout raíz con `children`                   |
| `ryx-loading`                  | `loading.ryx` (UI de carga)                  |
| `ryx-error`                    | `error.ryx` (error boundary de ruta)         |
| `ryx-errors`                   | `errors.ryx` global / 404                    |
| `ryx-metatags`                 | Solo `export const Metatags`                 |
| `ryx-import`                   | `import { … } from '@unsetsoft/ryunixjs'`    |
| `ryx-link` / `ryx-navlink`     | Navegación cliente                           |
| `ryx-api-get` / `ryx-api-post` | Handlers API `GET` / `POST`                  |
| `ryx-component`                | Componente genérico                          |

Dentro de `import { … }` aparecen completions (`useStore`, `Link`, etc.).

## Language Server (v1.1+)

Con `"ryunix.languageServer.enable": true` (por defecto), el servidor TypeScript del
workspace ofrece diagnósticos, autocompletado, ir a definición, referencias y rename
en `.ryx`. Añade un `jsconfig.json` en la raíz del proyecto (CRA lo genera con
`--vscode`) y, si usas alias `@/` en `ryunix.config.js`, replica los `paths` en
`compilerOptions.paths`.

Desactivar el LSP: `"ryunix.languageServer.enable": false` (quedan snippets y
navegación ligera).

## Navegación complementaria

| Gestión                         | Qué hace                                                                                                           |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------- |
| **Ctrl+clic** (ir a definición) | Imports locales, `@unsetsoft/ryunixjs`, alias `@/` (con `jsconfig`)                                                |
| **Hover**                       | Hooks Ryunix, etiquetas HTML, clases en `className` (siempre activo)                                               |
| **Tailwind**                    | Instala [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) |

Desactivar hover/tags: `"ryunix.enableNavigation": false`.

## Prettier opcional (proyectos con `--eslint`)

La plantilla `ryunix-eslint` incluye `.prettierrc.json` con override `*.ryx`
(`parser: "babel"`). Con `--vscode --eslint`, CRA también configura:

```json
"[ryunix]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
"prettier.documentSelectors": ["**/*.ryx"]
```

Instala la extensión **Prettier** cuando se recomiende.

## Probar en local (Extension Development Host)

1. Abre el monorepo (o `packages/ryunix-vscode`) en VS Code.
2. **Run and Debug** → configuración **Extension** → **F5**.
3. Se abre otra ventana de VS Code con la extensión cargada
   (`[Extension Development Host]` en la barra de título).
4. En esa ventana: **Archivo → Abrir carpeta** → p. ej.
   `packages/cra/templates/ryunix-base` o tu app Ryunix.
5. Abre o crea `app/index.ryx` y comprueba:
   - Resaltado en JSX y JS.
   - Snippets: `ryx-page` + Tab en un archivo vacío.
   - Completions: `import { use` → `useStore`, etc.
6. Tras cambiar código: detén el debug y **F5** de nuevo, o **Developer: Reload
   Window** en la ventana del host.

### Instalar `.vsix` sin Marketplace

```bash
pnpm install
pnpm --filter ./packages/ryunix-vscode run build
code --install-extension packages/ryunix-vscode/ryunixjs-1.0.4.vsix
```

También puedes usar **Extensions: Install from VSIX…** en la paleta de
comandos.

## Build y publicación

Desde la raíz del repositorio:

```bash
pnpm install
pnpm --filter ./packages/ryunix-vscode run build
```

Publicación en Marketplace (solo mantenedores):

```bash
pnpm --filter ./packages/ryunix-vscode run publish:marketplace
```

## Estructura del paquete

```text
packages/ryunix-vscode/
├── src/                    # Código TypeScript de la extensión
│   ├── extension.ts
│   └── completion/         # providers, hooks, plantillas por archivo
├── out/                    # JS compilado (generado)
├── language/               # Configuración del lenguaje
├── syntaxes/               # Gramática TextMate
├── snippets/
├── assets/                 # icono y logos
└── test/                   # Tests de regresión de gramática
```

Desarrollo: `pnpm --filter ./packages/ryunix-vscode run compile` (o `watch`), luego **F5**
en esta carpeta. El build de release ejecuta `compile` con `prebuild`.

Tests: `pnpm --filter ./packages/ryunix-vscode run test`. Ver `ROADMAP.md`.

No se publica en npm; solo `.vsix` / Marketplace.
