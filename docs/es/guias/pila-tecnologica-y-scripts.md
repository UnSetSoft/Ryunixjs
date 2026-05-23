# Pila tecnológica y scripts del monorepo

> **Language / Idioma:** [English](../../en/guides/tech-stack-and-scripts.md) ·
> [Español](./pila-tecnologica-y-scripts.md)

Referencia de **tecnologías usadas en el monorepo RyunixJS** y de los **scripts
`pnpm` de la raíz**. No sustituye la documentación profunda por paquete en
`docs/es/core/`, `docs/es/ryunix-presets/` ni `docs/es/cra/`.

> **Nota:** Esta página se generó con asistencia de IA y se contrastó con los
> `package.json`, `turbo.json` y `pnpm-workspace.yaml` del repositorio.

**Última revisión:** 2026-05-23

---

## Índice

- [Pila tecnológica y scripts del monorepo](#pila-tecnológica-y-scripts-del-monorepo)
  - [Índice](#índice)
  - [Alcance](#alcance)
  - [Organización del monorepo](#organización-del-monorepo)
  - [Tecnologías por área](#tecnologías-por-área)
  - [Scripts de la raíz (`package.json`)](#scripts-de-la-raíz-packagejson)
  - [Scripts por paquete (resumen)](#scripts-por-paquete-resumen)
  - [Documentación relacionada](#documentación-relacionada)

---

## Alcance

| Dentro del alcance                                     | Fuera del alcance                                         |
| :----------------------------------------------------- | :-------------------------------------------------------- |
| Lenguajes, runtimes y bibliotecas principales por área | Tutoriales paso a paso de cada herramienta                |
| Scripts del `package.json` raíz y tareas Turbo         | Cada flag de `ryunix` o Webpack                           |
| Scripts por paquete a nivel resumen                    | Apps generadas en `test/webpack` (local, en `.gitignore`) |

Para onboarding y estructura de carpetas, ver
[guia-del-repositorio.md](./guia-del-repositorio.md). Para tests y
`pnpm run:web`, ver [guia-de-pruebas.md](./guia-de-pruebas.md).

---

## Organización del monorepo

| Paquete                    | Nombre npm                   | Rol                                                  |
| :------------------------- | :--------------------------- | :--------------------------------------------------- |
| `packages/core`            | `@unsetsoft/ryunixjs`        | Runtime UI (VDOM, reconciliador, hooks, APIs SSR)    |
| `packages/ryunix-presets`  | `@unsetsoft/ryunix-presets`  | CLI `ryunix`, Webpack, routing, SSG, compilación API |
| `packages/cra`             | `@unsetsoft/cra`             | Scaffolder `npx @unsetsoft/cra` y plantillas         |
| `packages/ryunix-devtools` | `@unsetsoft/ryunix-devtools` | Extensión Chrome (Manifest V3)                       |

**Tooling del workspace:** workspaces de [pnpm](https://pnpm.io/)
(`pnpm-workspace.yaml`) y [Turborepo](https://turbo.build/) (`turbo.json`) para
`dev`, `build`, `test`, `lint` y `clean` en los paquetes.

**Motores (raíz):** Node.js `>=18`; pnpm `>=8` (el repo fija `pnpm@10.26.0` en
`packageManager`). Core y presets recomiendan Node `20`, `22` o `24`.

---

## Tecnologías por área

### Runtime (`@unsetsoft/ryunixjs`)

| Aspecto                    | Tecnología                                                                |
| :------------------------- | :------------------------------------------------------------------------ |
| Runtime publicado          | JavaScript plano (bundles ESM + UMD con Rollup)                           |
| Dependencias de producción | **Ninguna** (`dependencies` vacío en `packages/core`)                     |
| JSX                        | Runtime propio en `packages/core/jsx/` (`jsx-runtime`, `jsx-dev-runtime`) |
| Tests                      | Jest 30 + `jest-environment-jsdom`, `babel-jest`                          |

El framework publicado en npm no incluye React ni Preact.

### Build y tooling de apps (`@unsetsoft/ryunix-presets`)

| Área                          | Tecnologías                                                                                    |
| :---------------------------- | :--------------------------------------------------------------------------------------------- |
| Bundler                       | **Webpack 5** (configs cliente + servidor), `webpack-dev-server`, `webpack-cli`                |
| Transpilación                 | **Babel 7** (`preset-env`, `preset-react`, plugin JSX), **SWC** (`@swc/core`, `swc-loader`)    |
| Bundler alternativo (en deps) | **Vite 8**, `@vitejs/plugin-react-swc`                                                         |
| Build de librería (solo core) | **Rollup 4**                                                                                   |
| MDX / markdown                | `@mdx-js/loader`, `@mdx-js/rollup`, plugins **remark** / **rehype**                            |
| Estilos                       | **PostCSS**, **Sass**, `css-loader`, `mini-css-extract-plugin`, `css-minimizer-webpack-plugin` |
| CLI                           | `yargs`, `chalk`, `boxen`; binario `ryunix` → `webpack/bin/index.mjs`                          |
| Lint en toolchain             | ESLint 9, `eslint-webpack-plugin`, `eslint-plugin-mdx`                                         |

Las apps creadas con plantillas CRA consumen `@unsetsoft/ryunix-presets` y
`@unsetsoft/ryunixjs` (ver `packages/cra/templates/`).

### Scaffolding (`@unsetsoft/cra`)

| Área   | Tecnologías                                                                           |
| :----- | :------------------------------------------------------------------------------------ |
| CLI    | **Commander**, **prompts**, `cross-spawn`, `command-exists-promise`, `picocolors`     |
| Salida | Plantillas copiadas (`ryunix-base`, `ryunix-tailwind`, `ryunix-eslint`, `ryunix-all`) |

### DevTools de navegador (`@unsetsoft/ryunix-devtools`)

| Área        | Tecnologías                                                           |
| :---------- | :-------------------------------------------------------------------- |
| Extensión   | Extensión Chromium (Manifest V3); sin deps npm de runtime             |
| Integración | Comunicación con apps Ryunix en el navegador (ver README del paquete) |

### Desarrollo del monorepo (raíz del repositorio)

| Área                    | Tecnologías                                                                         |
| :---------------------- | :---------------------------------------------------------------------------------- |
| Gestor de paquetes      | **pnpm** 10 (workspaces, overrides `workspace:*`)                                   |
| Orquestación            | **Turbo** 2.8                                                                       |
| Lint                    | **ESLint** 9 (config plana `eslint.config.mjs`), plugins TypeScript ESLint          |
| Formato                 | **Prettier** 3.7                                                                    |
| Markdown                | **markdownlint-cli2** (config: `.markdownlint.json`, `.markdownlint-cli2.jsonc`)    |
| Tests (raíz)            | Jest / jsdom (uso principal desde `packages/core`)                                  |
| Entorno multiplataforma | `cross-env` (p. ej. `NODE_OPTIONS` en `run:web`)                                    |
| Releases                | `@kagarisoft/gmvu-cli` (`kg:init`, `kg:bump`), `commit-and-tag-version` (changelog) |

### Pila habitual en apps Ryunix generadas

No forma parte del `package.json` del monorepo, pero sí de las plantillas
oficiales:

| Área        | Elección habitual                                                |
| :---------- | :--------------------------------------------------------------- |
| UI          | `@unsetsoft/ryunixjs`                                            |
| CLI / build | `@unsetsoft/ryunix-presets` (`ryunix dev`, `build`, `start`)     |
| Config      | `ryunix.config.js`, `app/*.ryx`, opcional `app/api/**/router.js` |
| Opcional    | Variantes Tailwind / ESLint vía flags de CRA                     |

---

## Scripts de la raíz (`package.json`)

Los comandos se ejecutan desde la **raíz del repositorio** salvo indicación.

### Desarrollo habitual

| Script                  | Propósito                                                               |
| :---------------------- | :---------------------------------------------------------------------- |
| `pnpm install`          | Instalar dependencias del workspace                                     |
| `pnpm run dev`          | Turbo: `dev` en paquetes que lo definan (p. ej. CLI interactiva de CRA) |
| `pnpm run build`        | Turbo: compilar paquetes (`dependsOn: ^build`)                          |
| `pnpm run test`         | Turbo: tests (tras build)                                               |
| `pnpm run lint`         | ESLint en el repo + Turbo `lint` + `lint:md`                            |
| `pnpm run lint:fix`     | Prettier, ESLint `--fix`, corrección Turbo lint                         |
| `pnpm run format`       | Prettier en modo escritura                                              |
| `pnpm run format:check` | Solo comprobación Prettier                                              |
| `pnpm run lint:md`      | Markdownlint en `docs/`, `*.md` raíz, `packages/*/README.md`            |
| `pnpm run lint:md:fix`  | Script de corrección Markdown + Prettier                                |
| `pnpm run clean`        | Turbo `clean` + borrar `node_modules` de la raíz                        |

### App de integración local (framework en el navegador)

| Script                   | Propósito                                                      |
| :----------------------- | :------------------------------------------------------------- |
| `pnpm run run:web`       | `ryunix dev` sobre `test/webpack` (gitignored; crear en local) |
| `pnpm run run:web:build` | Build de producción de esa app                                 |
| `pnpm run run:web:start` | `ryunix start` de la app compilada                             |

`pnpm run dev` en la raíz **no** arranca la app Webpack de prueba; `run:web` es
el equivalente a `pnpm dev` en una aplicación Ryunix.

### Versionado y publicación

| Script                    | Propósito                                                 |
| :------------------------ | :-------------------------------------------------------- |
| `pnpm run kg:init`        | Inicializar metadatos de versión GMVU                     |
| `pnpm run kg:bump`        | Subir versiones (GMVU)                                    |
| `pnpm run release:canary` | Bump, format, publicar core `@canary`                     |
| `pnpm run release:stable` | Bump, format, publicar core estable                       |
| `pnpm run cra:release`    | Publicar `@unsetsoft/cra` estable                         |
| `pnpm run cra:nightly`    | Publicar CRA con tag `nightly`                            |
| `pnpm run publish:all`    | Publicar paquetes del workspace (sin `test/**`, devtools) |
| `pnpm run publish:canary` | Igual con tag npm `canary`                                |
| `pnpm run changelog`      | Generar changelog (`commit-and-tag-version`)              |
| `pnpm run git:push`       | `git push --follow-tags origin`                           |

### Tareas Turbo (resumen)

En `turbo.json`: `build`, `test`, `lint`, `dev` (persistente, sin caché),
`clean`, `canary:release`, `release`, `nightly:release`. Cada paquete debe
definir el script para que Turbo lo ejecute.

---

## Scripts por paquete (resumen)

| Paquete                      | Scripts principales                                                                                     |
| :--------------------------- | :------------------------------------------------------------------------------------------------------ |
| `@unsetsoft/ryunixjs`        | `build` (Rollup), `test` (Jest), `lint`, `prettier-check` / `prettier-fix`, `canary:release`, `release` |
| `@unsetsoft/ryunix-presets`  | (sin `scripts` en package.json; se usa el binario `ryunix`)                                             |
| `@unsetsoft/cra`             | `dev` (CLI local), `release`, `nightly:release`                                                         |
| `@unsetsoft/ryunix-devtools` | (ninguno; cargar sin empaquetar en Chrome)                                                              |

---

## Documentación relacionada

| Tema                             | Documento                                            |
| :------------------------------- | :--------------------------------------------------- |
| Onboarding del monorepo          | [guia-del-repositorio.md](./guia-del-repositorio.md) |
| Tests y `run:web`                | [guia-de-pruebas.md](./guia-de-pruebas.md)           |
| Índice de docs                   | [resumen.md](../resumen.md)                          |
| Contribución / comprobaciones PR | [CONTRIBUTING.es.md](../../CONTRIBUTING.es.md)       |
