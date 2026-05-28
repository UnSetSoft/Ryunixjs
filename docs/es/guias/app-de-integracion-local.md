# App de integración local

> **Language / Idioma:** [English](../../en/guides/local-integration-app.md) ·
> [Español](./app-de-integracion-local.md)

Guía para ejecutar el **sitio de documentación Ryunix** contra `packages/*` con
el workspace de pnpm y ver los cambios del framework en el navegador.

No sustituye a Jest ni a `pnpm lint` — ver
[tests-automatizados.md](./tests-automatizados.md).

| Vía                                 | Guía                                               |
| :---------------------------------- | :------------------------------------------------- |
| Tests automatizados                 | [tests-automatizados.md](./tests-automatizados.md) |
| App de integración (este documento) | `../ryunix-doc` + `pnpm run dev:doc`               |

---

## Índice

- [Conceptos clave](#conceptos-clave)
- [Primera vez](#primera-vez)
- [Cada sesión de trabajo](#cada-sesión-de-trabajo)
- [Comandos desde la raíz](#comandos-desde-la-raíz)
- [Qué hacer según el paquete](#qué-hacer-según-el-paquete)
- [Smoke de CI vs docs local](#smoke-de-ci-vs-docs-local)
- [Apps locales bajo test/](#apps-locales-bajo-test)
- [Git y commits](#git-y-commits)
- [Documentación relacionada](#documentación-relacionada)

---

## Conceptos clave

| Término                         | Qué es                                                                       |
| :------------------------------ | :--------------------------------------------------------------------------- |
| **Monorepo (`Ryunixjs/`)**      | Paquetes del framework (`packages/core`, `packages/ryunix-presets`, …).      |
| **`ryunix-doc` (repo hermano)** | Sitio canónico de docs. Entra en `pnpm-workspace.yaml` como `../ryunix-doc`. |
| **App de integración**          | Ese sitio con `workspace:*` en `@unsetsoft/ryunixjs` y presets.              |
| **`workspace:*`**               | pnpm enlaza `packages/*` en lugar de versiones de npm.                       |
| **`pnpm run dev:doc`**          | Compila core y ejecuta `ryunix dev` en `ryunix-doc`.                         |
| **`pnpm dev` (raíz)**           | Tareas Turbo (CRA, etc.). Para el navegador usa `dev:doc`.                   |

```text
ryx/                         ← carpeta padre habitual (no es un repo git)
├── Ryunixjs/                ← monorepo del framework
│   ├── packages/core/
│   └── packages/ryunix-presets/
└── ryunix-doc/              ← app de docs (miembro del workspace)
         │
         │  workspace:*  →  packages/
         │
         └── pnpm run dev:doc  →  http://localhost:…
```

No hay copia mantenida en `test/webpack`, `test/webpack1` ni `test/webpack2`.
Esas rutas están en `.gitignore`; lo que crees ahí es solo prueba local y no
forma parte del monorepo.

---

## Primera vez

### Requisitos

- Node.js 20, 22, 24 u 26 y pnpm 10+ (ver `CONTRIBUTING.md`).
- `Ryunixjs/` y `ryunix-doc/` como hermanos (ver esquema).

### Instalar y enlazar

```bash
cd Ryunixjs
pnpm run setup:web
```

Ejecuta `pnpm install`, compila `@unsetsoft/ryunixjs` y comprueba el enlace en
`../ryunix-doc/node_modules/@unsetsoft/ryunixjs`.

### Arrancar dev

```bash
pnpm run dev:doc
```

Abre la URL del terminal (p. ej. `http://localhost:3000`).

---

## Cada sesión de trabajo

1. **`pnpm run dev:doc`** — déjalo en marcha.
2. Edita según el ámbito:

| Editas…                       | Después de guardar                              |
| :---------------------------- | :---------------------------------------------- |
| `ryunix-doc/src/**`           | HMR recarga.                                    |
| `packages/core/src/**`        | `pnpm --filter @unsetsoft/ryunixjs build`, F5.  |
| `packages/ryunix-presets/**`  | Reinicia `pnpm run dev:doc`.                    |
| `packages/ryunix-devtools/**` | Recarga la extensión en `chrome://extensions/`. |

Antes del PR: `pnpm test`, `pnpm lint`.

---

## Comandos desde la raíz

| Comando                  | Acción                                       |
| :----------------------- | :------------------------------------------- |
| `pnpm run setup:web`     | Verifica `../ryunix-doc` y enlaces workspace |
| `pnpm run dev:doc`       | `ryunix dev` en el sitio de docs             |
| `pnpm run build:doc`     | Build de producción del sitio                |
| `pnpm run run:web`       | Alias de `dev:doc` (nombre legacy)           |
| `pnpm run run:web:build` | Alias de `build:doc`                         |
| `pnpm run run:web:start` | `ryunix start` en `ryunix-doc`               |

Si falla con «no projects matched», falta `../ryunix-doc` o no está en el
workspace.

---

## Qué hacer según el paquete

### `@unsetsoft/ryunix-presets`

1. `pnpm run build:core` si hace falta.
2. `pnpm run dev:doc`.
3. Rutas (`src/app/[locale]/`), `pnpm run build:doc`, SSR/hidratación.

### `@unsetsoft/ryunix-devtools`

1. `pnpm run dev:doc`.
2. Chrome → Cargar descomprimida → `packages/ryunix-devtools`.

---

## Smoke de CI vs docs local

|        | Integración local        | CI (`scripts/ci-smoke-build.mjs`)             |
| :----- | :----------------------- | :-------------------------------------------- |
| App    | `../ryunix-doc`          | `_ci/smoke-app` desde plantilla `ryunix-base` |
| Uso    | Docs y rutas `[locale]`  | Build mínimo del scaffold CRA                 |
| En git | repo `ryunix-doc` aparte | `_ci/` ignorado; se genera en CI              |

---

## Apps locales bajo test/

Puedes copiar `ryunix-base` a `test/mi-app/` para experimentos. La carpeta está
**ignorada por git** y **no** está en `pnpm-workspace.yaml` salvo que la añadas.
No commitees configs ni scripts de sincronización para esas copias: el sitio
compartido es `ryunix-doc`.

---

## Git y commits

| Ámbito                                  | Commits               |
| :-------------------------------------- | :-------------------- |
| `Ryunixjs/packages/*`, `Ryunixjs/docs/` | Sí → PR a `canary`    |
| `ryunix-doc/`                           | Sí → su repo / deploy |
| `test/webpack*` (cualquier nombre)      | Nunca — `.gitignore`  |

---

## Documentación relacionada

| Tema          | Enlace                                               |
| :------------ | :--------------------------------------------------- |
| Tests         | [tests-automatizados.md](./tests-automatizados.md)   |
| Guía del repo | [guia-del-repositorio.md](./guia-del-repositorio.md) |
| Índice        | [resumen.md](../resumen.md)                          |
