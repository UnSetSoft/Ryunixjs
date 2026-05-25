<!-- markdownlint-disable MD033 MD041 MD013 -->

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

CRA añade `.vscode/extensions.json` y `.vscode/settings.json` al crear un
proyecto con `--vscode` (Emmet, ESLint, asociación `*.ryx` → `ryunix`).

## Snippets (prefijos)

| Prefijo                    | Uso                                          |
| :------------------------- | :------------------------------------------- |
| `ryx-page`                 | Página de ruta (`Metatags` + export default) |
| `ryx-layout`               | Layout raíz con `children`                   |
| `ryx-errors`               | Página `errors.ryx` / 404                    |
| `ryx-metatags`             | Solo `export const Metatags`                 |
| `ryx-import`               | `import { … } from '@unsetsoft/ryunixjs'`    |
| `ryx-link` / `ryx-navlink` | Navegación cliente                           |
| `ryx-api-get`              | Handler API `GET`                            |
| `ryx-component`            | Componente genérico                          |

Dentro de `import { … }` aparecen completions (`useStore`, `Link`, etc.).

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
code --install-extension packages/ryunix-vscode/ryunixjs-1.0.3.vsix
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

## Contenido del paquete

| Ruta                                        | Función                                         |
| :------------------------------------------ | :---------------------------------------------- |
| `extension.js`                              | Completions de exports de `@unsetsoft/ryunixjs` |
| `syntaxes/JavaScriptRyunix.tmLanguage.json` | Gramática TextMate                              |
| `snippets/javascript.code-snippets`         | Snippets Ryunix + JSX                           |
| `language-configuration.json`               | Corchetes y auto-cierre                         |
| `tags-language-configuration.json`          | Lenguaje embebido para tags                     |

No se publica en npm; solo `.vsix` / Marketplace.
