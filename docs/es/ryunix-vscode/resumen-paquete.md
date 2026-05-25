# `packages/ryunix-vscode` — extensión VS Code

Código fuente de la extensión de editor **RyunixJS** publicada en Visual
Studio Marketplace como
[`unsetsoft.ryunixjs`](https://marketplace.visualstudio.com/items?itemName=unsetsoft.ryunixjs).

---

## Rol en el monorepo

| Aspecto | Detalle |
| :------ | :------ |
| **Consumidor** | Desarrolladores que editan archivos `.ryx` en VS Code |
| **No es dependencia npm de runtime** | Las apps usan `@unsetsoft/ryunixjs`; este paquete solo afecta al editor |
| **Integración CRA** | `create-app.js` puede escribir `.vscode/extensions.json` recomendando `unsetsoft.ryunixjs` con `--vscode` |

---

## Estructura

```text
packages/ryunix-vscode/
├── package.json              # Manifiesto (name debe ser "ryunixjs" para el ID del Marketplace)
├── syntaxes/                 # Gramática TextMate (JavaScript + JSX-like .ryx)
├── snippets/
├── language-configuration.json
├── tags-language-configuration.json
├── icon.png, logo-*.svg
└── .vscode/launch.json       # F5 Extension Development Host
```

El campo `"name": "ryunixjs"` en `package.json` es intencional: el ID del
Marketplace es `{publisher}.{name}` → `unsetsoft.ryunixjs`.

---

## Comandos

Desde la raíz del repositorio (tras `pnpm install`):

```bash
# Empaquetar un .vsix para instalación local o artefactos CI
pnpm --filter ./packages/ryunix-vscode run build

# Publicar en Visual Studio Marketplace (mantenedores, PAT requerido)
pnpm --filter ./packages/ryunix-vscode run publish:marketplace
```

Instalación local de un `.vsix` generado:

```bash
code --install-extension packages/ryunix-vscode/ryunixjs-1.0.2.vsix
```

---

## Flujo de desarrollo

1. Abre `packages/ryunix-vscode` en VS Code (o el monorepo completo).
2. Pulsa **F5** (config **Extension**) para abrir una ventana con la extensión
   cargada.
3. Abre cualquier archivo `.ryx` (p. ej. en `test/webpack` tras
   `pnpm run setup:web` en ramas que lo incluyan).
4. Edita gramáticas o snippets; recarga el Extension Development Host para
   probar.

---

## Notas de release

- Versión y changelog en `packages/ryunix-vscode/package.json` y `CHANGELOG.md`.
- `pnpm publish:all` en la raíz **excluye** este paquete (solo Marketplace, como
  `ryunix-devtools` en npm).

---

## Documentación relacionada

| Tema | Documento |
| :--- | :-------- |
| Flag CRA `--vscode` | [../cra/cli-y-ayudantes.md](../cra/cli-y-ayudantes.md) |
| Extensión Chrome DevTools | `packages/ryunix-devtools` (depuración en navegador, distinta de VS Code) |
