<!-- markdownlint-disable MD013 MD060 -->

# `packages/cra` — `@unsetsoft/cra`

**Scaffolder oficial** de proyectos Ryunix: la CLI que ejecutas con
`npx @unsetsoft/cra`. Copia una plantilla al disco, resuelve versiones npm
(latest o canary), opcionalmente añade Tailwind, ESLint, integración VS Code e
inicializa git. **No forma parte del runtime** de las apps ya creadas.

**Lectura recomendada después:** [cli-y-ayudantes.md](./cli-y-ayudantes.md) y
[generacion-de-plantillas.md](./generacion-de-plantillas.md).

---

## Rol en el monorepo

| Aspecto | Detalle |
| :------ | :------ |
| **Quién lo usa** | Desarrolladores al crear un proyecto nuevo |
| **Qué produce** | Carpeta de app con `app/`, `ryunix.config.js`, `package.json` |
| **Dependencias que inyecta** | `@unsetsoft/ryunixjs`, `@unsetsoft/ryunix-presets` (+ Tailwind/ESLint si aplica) |
| **Publicación** | npm; incluido en `pnpm publish:all` / canary |

```mermaid
flowchart LR
  User[npx @unsetsoft/cra]
  CRA[packages/cra]
  Template[templates/ryunix-*]
  App[Proyecto nuevo]
  User --> CRA
  CRA --> Template
  Template --> App
  App --> Presets[ryunix dev/build]
  App --> Core[@unsetsoft/ryunixjs]
```

---

## Estructura del paquete

```text
packages/cra/
├── src/
│   ├── cli.js                 # Entrada Commander (bin del paquete)
│   └── create-app.js          # Prompts, copia, versiones, .vscode, git
├── helpers/
│   ├── copy.js                # Copia recursiva de plantilla
│   ├── is-folder-empty.js     # Valida directorio destino
│   ├── get-pkg-manager.js     # Detecta npm / yarn / pnpm / bun
│   ├── install.js             # Helper install (no usado en flujo actual)
│   ├── git.js                 # git init + commit inicial
│   └── ensure-public-favicon.js
├── templates/
│   ├── ryunix-base/           # Mínimo
│   ├── ryunix-tailwind/
│   ├── ryunix-eslint/
│   └── ryunix-all/            # Tailwind + ESLint
└── package.json
```

### Selección de plantilla

| Condición | Plantilla |
| :-------- | :-------- |
| `--tailwind` y `--eslint` | `ryunix-all` |
| Solo `--tailwind` | `ryunix-tailwind` |
| Solo `--eslint` | `ryunix-eslint` |
| Ninguno | `ryunix-base` |

Los prompts interactivos omiten preguntas si pasas flags (`--no-tailwind`,
`--no-eslint`, `--no-vscode` detectados en `process.argv`).

### Contenido típico de una plantilla

```text
app/
  index.ryx          # Página raíz
  layout.ryx         # Layout global
  errors.ryx         # 404 / not found (nombre usado en plantillas)
  api/hello/router.js
assets/logo.svg
styles/global.css
ryunix.config.js
package.json         # scripts: dev, build, start (+ lint en ryunix-all)
vercel.json
gitignore              # → renombrado a .gitignore al generar
```

Tras copiar: `ensurePublicFavicon()` crea `public/favicon.png` si falta.

**Nota npm:** las plantillas llevan `gitignore` sin punto porque npm ignora
`.gitignore` al publicar el paquete; `create-app.js` lo renombra.

---

## Flujo de `create-app.js`

1. Resolver ruta destino (argumento o prompt); comprobar carpeta vacía.
2. Elegir plantilla según flags/prompts.
3. `copyRecursiveSync` (ignora `node_modules`, `dist`, `.ryx` en origen).
4. Mutar `package.json`: `name`, `version: 0.1.0`, `private: true`.
5. Consultar npm (`npm view` / `pnpm view` / …) versiones de
   `@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` (`latest` o `canary`).
6. Añadir dependencias Tailwind/ESLint si corresponde.
7. Inyectar `compiler: 'swc'|'babel'` en `ryunix.config.js`.
8. Si `--vscode`: escribir `.vscode/extensions.json` y `settings.json` (ver abajo).
9. `tryGitInit`: repositorio git y commit inicial.
10. Mensaje final: el usuario debe ejecutar `pnpm install` y `pnpm run dev`
    (**no** se invoca `install()` automáticamente hoy).

---

## Flags de la CLI

| Flag | Efecto |
| :--- | :----- |
| `[directorio]` | Nombre o ruta del proyecto |
| `--latest` / `--canary` | Canal de versiones Ryunix |
| `--tailwind` | Plantilla con Tailwind |
| `--eslint` | Plantilla con ESLint (+ Prettier en `.prettierrc.json`) |
| `--vscode` | Carpeta `.vscode` con extensiones recomendadas |
| `--compiler swc\|babel` | Escrito en `ryunix.config.js` |
| `--no-tailwind` / `--no-eslint` / `--no-vscode` | Omiten prompts (argv) |

### Integración `--vscode`

| Archivo | Contenido |
| :------ | :-------- |
| `extensions.json` | `unsetsoft.ryunixjs`, `dbaeumer.vscode-eslint`; + Prettier si `--eslint` |
| `settings.json` | `*.ryx` → idioma `ryunix`, Emmet, ESLint probe, file nesting en rutas |

Documentación de la extensión:
[../ryunix-vscode/resumen-paquete.md](../ryunix-vscode/resumen-paquete.md).

---

## Comandos

```bash
# Desarrollo local del paquete CRA
pnpm --filter @unsetsoft/cra run dev

# Usuarios finales
npx @unsetsoft/cra@latest my-app
npx @unsetsoft/cra@latest my-app --canary --tailwind --eslint --vscode
```

Publicación (mantenedores): `pnpm run cra:release` o `pnpm run cra:nightly` en la raíz.

---

## Relación con otros paquetes

| Paquete | Relación |
| :------ | :------- |
| `core` / `ryunix-presets` | Versiones y deps añadidas al `package.json` generado |
| `ryunix-vscode` | Recomendada con `--vscode`; no dependencia npm de CRA |
| `ryunix-devtools` | No la instala; el desarrollador la carga en Chrome aparte |

---

## Documentación en `docs/es/cra/`

| Documento | Tema |
| :-------- | :--- |
| [cli-y-ayudantes.md](./cli-y-ayudantes.md) | Commander, prompts, resolución de versiones |
| [generacion-de-plantillas.md](./generacion-de-plantillas.md) | Mantener y añadir plantillas |

Par en inglés: [docs/en/cra/package-overview.md](../../en/cra/package-overview.md).

README público del paquete: `packages/cra/README.md`.
