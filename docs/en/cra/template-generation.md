# Create Ryunix App: template generation

> **Language / Idioma:** [English](./template-generation.md) ·
> [Español](../../es/cra/generacion-de-plantillas.md)

Ryunix does not procedurally generate hundreds of files: it uses **snapshot
directories** under `packages/cra/templates/` copied 1:1 to the user’s target
folder. Package overview: [package-overview.md](./package-overview.md).

---

## Table of contents

- [Create Ryunix App: template generation](#create-ryunix-app-template-generation)
  - [Table of contents](#table-of-contents)
  - [Template selection](#template-selection)
  - [The four templates](#the-four-templates)
  - [Typical layout (`ryunix-base`)](#typical-layout-ryunix-base)
  - [Copy mechanism](#copy-mechanism)
  - [The `gitignore` file workaround](#the-gitignore-file-workaround)
  - [What the user does next](#what-the-user-does-next)

---

## Template selection

Logic in `create-app.ts`:

| Tailwind | ESLint | Copied folder |
| :------: | :----: | :------------ |
| no | no | `ryunix-base` |
| yes | no | `ryunix-tailwind` |
| no | yes | `ryunix-eslint` |
| yes | yes | `ryunix-all` |

---

## The four templates

### `ryunix-base`

Minimal app: `.ryx` routes, global styles, sample API route, empty
`ryunix.config.js` (the CLI injects `compiler`), `package.json` with `dev` /
`build` / `start` scripts that call `ryunix`.

### `ryunix-tailwind`

Same as base plus:

- `postcss.config.js` with `@tailwindcss/postcss` and `autoprefixer`
- `tailwind.config.js`
- Styles set up for Tailwind in `styles/global.css`

`create-app` adds to `package.json`: `tailwindcss`, `@tailwindcss/postcss`,
`postcss`.

### `ryunix-eslint`

Base plus linting:

- `.eslintrc.json`, `.eslintignore`
- React ESLint plugins added to devDependencies at generation time

### `ryunix-all`

Combines Tailwind and ESLint (files from both variants).

All templates include a sample `vercel.json` and `assets/logo.svg` on the home
page.

---

## Typical layout (`ryunix-base`)

```text
my-app/
├── app/
│   ├── index.ryx          # Home page
│   ├── layout.ryx         # Global layout
│   ├── error.ryx          # Route-level errors
│   └── api/
│       └── hello/
│           └── router.js  # Sample API (preset compiles with SWC)
├── styles/
│   └── global.css
├── assets/
│   └── logo.svg
├── ryunix.config.js       # RyunixUserConfig (@unsetsoft/ryunix-presets)
├── package.json
└── .gitignore             # Renamed from template `gitignore`
```

Ryunix app conventions (not Next.js): routes under `app/`, no `page.tsx` or
`src/features/` unless the project adds them later.

The template `package.json` only defines scripts; `create-app` writes
`@unsetsoft/ryunixjs` and `@unsetsoft/ryunix-presets` versions after querying
npm.

---

## Copy mechanism

`copyRecursiveSync` in `helpers/copy.ts`:

- Walks template files and directories.
- Skips `node_modules`, `dist`, and `.ryunix` if present in a template.
- Does not replace `{{name}}`-style placeholders: the template `package.json`
  uses a generic name and `create-app` overwrites `name` with the chosen
  directory basename.

There is no automatic dependency install step in the current CLI.

---

## The `gitignore` file workaround

`npm publish` can omit `.gitignore` from the CRA package tarball. Templates ship
a file named **`gitignore`** (no leading dot). After copy, `create-app.ts`
renames it to **`.gitignore`** in the user project.

To copy a template manually (e.g. integration app under `test/`):

```bash
cp -r packages/cra/templates/ryunix-base test/my-app
cp packages/cra/templates/ryunix-base/gitignore test/my-app/.gitignore
```

---

## What the user does next

1. `cd` into the created directory.
2. Install dependencies (`pnpm install`, `npm install`, etc.).
3. `pnpm run dev` (or equivalent) → runs the preset’s `ryunix dev`.
4. Edit `app/index.ryx` and `ryunix.config.js`.

The preset (`@unsetsoft/ryunix-presets`) documents Webpack, routing, and SSG
under [docs/en/ryunix-presets/](../ryunix-presets/).
