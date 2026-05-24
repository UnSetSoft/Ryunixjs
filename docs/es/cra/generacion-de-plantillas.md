# Create Ryunix App: generación de plantillas

> **Language / Idioma:** [English](../../en/cra/template-generation.md) ·
> [Español](./generacion-de-plantillas.md)

Ryunix no genera archivos procedimentalmente en masa: usa **directorios
snapshot** en `packages/cra/templates/` que se copian 1:1 al destino del
usuario. Visión del paquete: [resumen-del-paquete.md](./resumen-del-paquete.md).

---

## Índice

- [Create Ryunix App: generación de plantillas](#create-ryunix-app-generación-de-plantillas)
  - [Índice](#índice)
  - [Selección de plantilla](#selección-de-plantilla)
  - [Las cuatro plantillas](#las-cuatro-plantillas)
  - [Layout típico (`ryunix-base`)](#layout-típico-ryunix-base)
  - [Mecanismo de copia](#mecanismo-de-copia)
  - [Truco del archivo `gitignore`](#truco-del-archivo-gitignore)
  - [Qué hace el usuario después](#qué-hace-el-usuario-después)

---

## Selección de plantilla

Lógica en `create-app.ts`:

| Tailwind | ESLint | Carpeta copiada |
| :------: | :----: | :-------------- |
| no | no | `ryunix-base` |
| sí | no | `ryunix-tailwind` |
| no | sí | `ryunix-eslint` |
| sí | sí | `ryunix-all` |

---

## Las cuatro plantillas

### `ryunix-base`

App mínima: rutas `.ryx`, estilos globales, API de ejemplo, `ryunix.config.js`
vacío (el CLI inyecta `compiler`), `package.json` con scripts `dev` / `build` /
`start` que llaman a `ryunix`.

### `ryunix-tailwind`

Igual que base más:

- `postcss.config.js` con `@tailwindcss/postcss` y `autoprefixer`
- `tailwind.config.js`
- Estilos preparados para Tailwind en `styles/global.css`

`create-app` añade en `package.json`: `tailwindcss`, `@tailwindcss/postcss`,
`postcss`.

### `ryunix-eslint`

Base más linting:

- `.eslintrc.json`, `.eslintignore`
- Plugins React en devDependencies al generar

### `ryunix-all`

Combinación de Tailwind y ESLint (archivos de ambas variantes).

Todas incluyen `vercel.json` de ejemplo y `assets/logo.svg` en la página de
inicio.

---

## Layout típico (`ryunix-base`)

```text
mi-app/
├── app/
│   ├── index.ryx          # Página principal
│   ├── layout.ryx         # Layout global
│   ├── error.ryx          # Errores por ruta
│   └── api/
│       └── hello/
│           └── router.js  # Ejemplo API (preset compila con SWC)
├── styles/
│   └── global.css
├── assets/
│   └── logo.svg
├── ryunix.config.js       # RyunixUserConfig (@unsetsoft/ryunix-presets)
├── package.json
└── .gitignore             # Renombrado desde `gitignore` en la plantilla
```

Convenciones de app Ryunix (no Next.js): rutas bajo `app/`, sin `page.tsx` ni
`src/features/` salvo que el proyecto lo añada después.

El `package.json` de plantilla solo define scripts; las versiones de
`@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` las escribe `create-app` al
consultar npm.

---

## Mecanismo de copia

`copyRecursiveSync` en `helpers/copy.ts`:

- Recorre directorios y archivos del template.
- Omite carpetas `node_modules`, `dist` y `.ryunix` si existieran en la
  plantilla.
- No sustituye placeholders tipo `{{name}}` en el nombre del paquete: el
  `package.json` de plantilla usa un nombre genérico y `create-app` sobrescribe
  `name` con el basename del directorio elegido.

No hay paso de “instalar dependencias” automático en el CLI actual.

---

## Truco del archivo `gitignore`

`npm publish` no incluye bien `.gitignore` en algunos flujos del paquete CRA.
Las plantillas envían un archivo llamado **`gitignore`** (sin punto). Tras la
copia, `create-app.ts` lo renombra a **`.gitignore`** en el proyecto del
usuario.

Para copiar manualmente una plantilla (p. ej. app de integración en `test/`):

```bash
cp -r packages/cra/templates/ryunix-base test/mi-app
cp packages/cra/templates/ryunix-base/gitignore test/mi-app/.gitignore
```

---

## Qué hace el usuario después

1. `cd` al directorio creado.
2. Instalar dependencias (`pnpm install`, `npm install`, etc.).
3. `pnpm run dev` (o equivalente) → ejecuta `ryunix dev` del preset.
4. Editar `app/index.ryx` y `ryunix.config.js`.

El preset (`@unsetsoft/ryunix-presets`) documenta Webpack, routing y SSG en
[docs/es/ryunix-presets/](../ryunix-presets/).
