<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

# Extensión Ryunix para VS Code

Soporte de lenguaje en VS Code para archivos `.ryx` de Ryunix (resaltado de
sintaxis, snippets y valores predeterminados del editor).

**ID en Marketplace:** `unsetsoft.ryunixjs`

## Instalar desde Marketplace

Busca **RyunixJS** en la vista de Extensiones de VS Code, o:

```bash
code --install-extension unsetsoft.ryunixjs
```

CRA puede añadir una recomendación de workspace al crear un proyecto con
`--vscode`.

## Desarrollar en el monorepo

1. Abre `packages/ryunix-vscode` en VS Code (o el monorepo completo).
2. Ejecuta **Extension** desde `.vscode/launch.json` (F5) para abrir un
   Extension Development Host.
3. Abre un archivo `.ryx` y comprueba el resaltado y los snippets.

## Build y publicación

Desde la raíz del repositorio:

```bash
pnpm install
pnpm --filter ./packages/ryunix-vscode run build
```

Genera `packages/ryunix-vscode/ryunixjs-*.vsix`. Publicación en Marketplace
(solo mantenedores):

```bash
pnpm --filter ./packages/ryunix-vscode run publish:marketplace
```

Requiere un token de publicador en
[Visual Studio Marketplace](https://marketplace.visualstudio.com/) para
`unsetsoft`.

## Contenido

| Ruta | Función |
| :--- | :------ |
| `syntaxes/JavaScriptRyunix.tmLanguage.json` | Gramática TextMate para `.ryx` |
| `snippets/javascript.code-snippets` | Snippets del editor |
| `language-configuration.json` | Corchetes, comentarios, auto-cierre |
| `tags-language-configuration.json` | Config de lenguaje embebido para tags |

Este paquete **no** se publica en npm; solo el `.vsix` / release en
Marketplace.
