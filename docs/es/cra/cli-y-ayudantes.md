# Create Ryunix App: CLI y ayudantes

> **Language / Idioma:** [English](../../en/cra/cli-and-helpers.md) ·
> [Español](./cli-y-ayudantes.md)

Entrada del paquete `@unsetsoft/cra`: argumentos, prompts interactivos y
módulos en `packages/cra/src/`. Visión general del paquete:
[resumen-del-paquete.md](./resumen-del-paquete.md).

---

## Índice

- [Create Ryunix App: CLI y ayudantes](#create-ryunix-app-cli-y-ayudantes)
  - [Índice](#índice)
  - [Entrada: `cli.ts`](#entrada-clits)
  - [Motor: `create-app.ts`](#motor-create-appts)
  - [Ayudantes (`src/helpers/`)](#ayudantes-srchelpers)
  - [Probar el CLI en el monorepo](#probar-el-cli-en-el-monorepo)

---

## Entrada: `cli.ts`

Archivo publicado como `src/cli.js` (emitido por TypeScript). Usa **Commander**
para flags y **prompts** cuando faltan opciones.

### Argumento posicional

| Argumento | Descripción |
| :-------- | :------------ |
| `[directory]` | Nombre o ruta de la carpeta del proyecto. Si se omite, se pregunta en consola. |

### Flags

| Flag | Efecto |
| :--- | :----- |
| `-v, --version` | Versión del paquete CRA |
| `-h, --help` | Ayuda |
| `--canary` | Canal Canary para dependencias Ryunix |
| `--latest` | Canal Latest (por defecto si no hay prompt de canal) |
| `--tailwind` | Plantilla con Tailwind |
| `--eslint` | Plantilla con ESLint |
| `--vscode` | Crea `.vscode/extensions.json` con la extensión Ryunix |
| `--compiler <swc\|babel>` | Compilador en `ryunix.config.js` (por defecto `swc`) |

Si no pasas `--canary` ni `--latest`, el CLI pregunta el canal. Igual para
Tailwind, ESLint y VS Code salvo que uses los flags anteriores.

Al final llama a `createApp()` con `appPath`, `appName` (basename del directorio),
`channel`, `compiler`, `tailwind`, `eslint` y `vscode`.

---

## Motor: `create-app.ts`

Función exportada `createApp(options: CreateAppOptions)`.

### Pasos

1. **Resolver ruta** — `path.resolve(appPath)`; crear carpeta si no existe.
2. **Validar vacío** — `isFolderEmpty()`; si hay archivos conflictivos, sale con
   código 1.
3. **Elegir plantilla** — Ver tabla en
   [generacion-de-plantillas.md](./generacion-de-plantillas.md).
4. **Copiar** — `copyRecursiveSync(templateDir, root)`.
5. **Renombrar `gitignore`** — El archivo de plantilla `gitignore` pasa a
   `.gitignore` (limitación de `npm publish` con dotfiles).
6. **`package.json`** — Asigna `name`, `version`, `private`; consulta el registro
   (`npm view`, `yarn info` o `pnpm view` según el gestor detectado) para
   `@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` en el tag `latest` o
   `canary`; añade devDeps de Tailwind o ESLint si aplica.
7. **`ryunix.config.js`** — Si el template contiene `const RyunixSettings = {`,
   inserta `compiler: 'swc'|'babel'` dentro del objeto.
8. **VS Code** — Si `vscode`, escribe `.vscode/extensions.json` con
   `unsetsoft.ryunixjs`.
9. **Git** — `tryGitInit(root)` opcional (rama `main`, commit inicial).
10. **Mensaje final** — Indica `cd`, `install` y `run dev` (no ejecuta install).

### Resolución de versiones

```text
npm view @unsetsoft/ryunixjs@<latest|canary> version
npm view @unsetsoft/ryunix-presets@<latest|canary> version
```

Si falla la consulta, se usa el tag literal (`latest` / `canary`) y se muestra
un aviso. Las versiones resueltas se escriben con prefijo `^` en
`dependencies` / `devDependencies`.

### Tipos exportados

- `RyunixChannel`: `'Latest' | 'Canary'`
- `RyunixCompiler`: `'swc' | 'babel'`
- `CreateAppOptions`: parámetros de `createApp`

---

## Ayudantes (`src/helpers/`)

| Módulo | Función | Uso |
| :----- | :------ | :-- |
| `copy.ts` | `copyRecursiveSync(src, dest)` | Copia árbol de plantilla; omite `node_modules`, `dist`, `.ryunix` |
| `get-pkg-manager.ts` | `getPkgManager()` | Lee `npm_config_user_agent` → `npm` \| `yarn` \| `pnpm` \| `bun` |
| `is-folder-empty.ts` | `isFolderEmpty(root, name)` | Permite solo archivos “seguros” (`.git`, `LICENSE`, etc.) |
| `git.ts` | `tryGitInit(root)` | `git init`, rama `main`, `add -A`, commit inicial; revierte si falla |
| `install.ts` | `install(pm, cwd)` | Ejecuta `install` con flags silenciosos; **no** lo llama `create-app` hoy |

---

## Probar el CLI en el monorepo

Desde la raíz del monorepo (tras `pnpm --filter @unsetsoft/cra build` si
cambiaste `.ts`):

```bash
node packages/cra/src/cli.js ../_cra/mi-prueba --latest --tailwind
```

Ver también [tests automatizados](../guias/tests-automatizados.md) y
[app de integración local](../guias/app-de-integracion-local.md).

Mantenimiento TypeScript:

```bash
pnpm --filter @unsetsoft/cra typecheck
pnpm --filter @unsetsoft/cra build
```
