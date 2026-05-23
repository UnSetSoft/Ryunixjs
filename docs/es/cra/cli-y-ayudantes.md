# Create Ryunix App: CLI y helpers

El paquete `@unsetsoft/create-ryunix-app` funciona como la puerta de entrada principal de scaffolding.

---

## 1. Argumentos CLI y prompts (`cli.js`)
Construido enteramente sobre las bibliotecas interactivas de terminal Node `commander` y `prompts`.
- Intercepta argumentos implícitos de shell (`--tailwind`, `--canary`, `--compiler=swc`).
- Si se omiten, recurre con elegancia a elecciones interactivas de terminal consultando al desarrollador con seguridad y evitando fallos de instalación.
- Captura la estructura exacta de nomenclatura del directorio objetivo del proyecto.

## 2. Motor de ejecución central (`create-app.js`)
La función `createApp` orquesta los despliegues físicos de carpetas.
- **Resolvedores de dependencias**: En lugar de codificar versiones estáticas de forma nativa (que envejecen), ejecuta consultas shell dinámicas (`npm view`, `yarn info`) inspeccionando el registro NPM explícitamente extrayendo la versión semántica estricta más reciente que representa las etiquetas `--latest` o `--canary` elegidas tanto para `@unsetsoft/ryunixjs` como para `@unsetsoft/ryunix-presets`.
- **Enrutamiento objetivo**: Determina exactamente cuál de las 4 `templates` nativas copiar físicamente (`ryunix-base`, `ryunix-eslint`, `ryunix-tailwind` o `ryunix-all`) aprovechando `copyRecursiveSync`.
- **Modificaciones de configuración**: Muta estáticamente el `package.json` generado cambiando el `name` genérico al nombre de carpeta explícito del desarrollador. Si se modificó `--compiler`, inyecta sustituciones de cadena físicamente directamente en `ryunix.config.js`.
- **Automatización VSCode**: Opcionalmente escribe `.vscode/extensions.json` forzando al Editor a recomendar el addon de resaltado de sintaxis físico `unsetsoft.ryunixjs` de forma nativa.

## 3. Ejecuciones de terminal (`commands.js`)
Aloja shells de ejecución a nivel de SO en bruto comprobando si existen configuraciones binarias (p. ej. `code` ejecutando instalaciones nativas de extensiones VS Code fuera de banda de forma nativa).
