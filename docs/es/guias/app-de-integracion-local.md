# App de integración local

> **Language / Idioma:** [English](../../en/guides/local-integration-app.md) ·
> [Español](./app-de-integracion-local.md)

Guía para montar y usar una **aplicación Ryunix de prueba** dentro del monorepo,
de modo que los cambios en `packages/*` se vean en el navegador como en una app
real creada con el framework.

No sustituye a Jest ni a `pnpm lint` — ver
[tests-automatizados.md](./tests-automatizados.md).

| Vía                                 | Guía                                               |
| :---------------------------------- | :------------------------------------------------- |
| Tests automatizados                 | [tests-automatizados.md](./tests-automatizados.md) |
| App de integración (este documento) | `test/webpack` + `pnpm run:web`                    |

---

## Índice

- [App de integración local](#app-de-integración-local)
  - [Índice](#índice)
  - [Conceptos clave](#conceptos-clave)
  - [Paso a paso: primera vez](#paso-a-paso-primera-vez)
  - [Paso a paso: cada sesión de trabajo](#paso-a-paso-cada-sesión-de-trabajo)
  - [Comandos desde la raíz del monorepo](#comandos-desde-la-raíz-del-monorepo)
  - [Qué hacer según el paquete que se modifique](#qué-hacer-según-el-paquete-que-se-modifique)
  - [Crear la app con CRA (alternativa)](#crear-la-app-con-cra-alternativa)
  - [Estructura de la app](#estructura-de-la-app)
  - [Git y commits](#git-y-commits)
  - [Documentación relacionada](#documentación-relacionada)

---

## Conceptos clave

Antes de los comandos, conviene distinguir estos términos:

| Término                         | Qué es                                                                                                                                                        |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo (raíz `Ryunixjs/`)** | Repositorio del **framework**: `packages/core`, `packages/ryunix-presets`, etc. No es una app web; no tiene `app/index.ryx` en la raíz.                       |
| **App de integración**          | Una **app Ryunix normal** (`app/*.ryx`, `ryunix.config.js`) viva en `test/webpack/`. Simula lo que genera `npx @unsetsoft/cra`.                               |
| **`test/webpack`**              | Ruta **recomendada** para esa app. Está en `.gitignore`: no se sube a git; cada persona la crea en su máquina.                                                |
| **`workspace:*`**               | En el `package.json` de la app, indica a pnpm: «usa el paquete que está en `packages/` de este repo», no la versión de npmjs.com.                             |
| **Symlink (enlace simbólico)**  | Tras `pnpm install`, `test/webpack/node_modules/@unsetsoft/ryunixjs` apunta a `packages/core/`. Así el navegador carga el código que se edita en el monorepo. |
| **`pnpm run:web`**              | Script de la **raíz** que ejecuta `ryunix dev` dentro de `test/webpack` (servidor de desarrollo + HMR).                                                       |
| **`pnpm dev` (raíz)**           | **No** abre la app de integración. Hoy lanza tareas Turbo (p. ej. CLI de CRA). Para el navegador se usa `pnpm run:web`.                                       |

```text
Ryunixjs/                    ← monorepo (framework)
├── packages/core/           ← motor UI (@unsetsoft/ryunixjs)
├── packages/ryunix-presets/ ← CLI ryunix + Webpack
└── test/webpack/            ← app de integración (gitignored)
         │
         │  workspace:*  →  enlaza a packages/, no a npm
         │
         └── pnpm run:web  →  ryunix dev  →  http://localhost:…
```

### Para qué sirve esta app

| Objetivo                       | Ejemplo                                       |
| :----------------------------- | :-------------------------------------------- |
| Ver cambios en `packages/core` | Página con `useStore`, hidratación            |
| Probar `ryunix-presets`        | `ryunix dev`, rutas en `app/`, `ryunix build` |
| Probar DevTools                | Extensión Chrome + pestaña Ryunix en F12      |
| Validar plantillas CRA         | Misma estructura que `ryunix-base`            |

---

## Paso a paso: primera vez

Secuencia completa desde un clon nuevo del repo hasta ver la app en el
navegador. Solo hace falta hacerlo **una vez** por máquina (o si se borra
`test/webpack`).

### 0. Requisitos

- Node.js 20, 22 o 24 y pnpm 10+ (ver `CONTRIBUTING.md`).
- Estar en la **raíz** del monorepo (`Ryunixjs/`).

### 1. Instalar dependencias del monorepo

```bash
pnpm install
```

Instala `packages/*` y deja listo el workspace. Aún **no** existe la app en
`test/webpack`.

### 2. Crear la carpeta de la app (copiar plantilla)

La plantilla oficial está en `packages/cra/templates/ryunix-base/`. Se copia a
`test/webpack`:

```bash
mkdir -p test
cp -r packages/cra/templates/ryunix-base test/webpack
cp packages/cra/templates/ryunix-base/gitignore test/webpack/.gitignore
```

Comprobar que existen, por ejemplo, `test/webpack/app/index.ryx` y
`test/webpack/ryunix.config.js`.

### 3. Configurar `package.json` con `workspace:*`

La plantilla copiada **no trae** dependencias al framework; hay que añadirlas.
Editar `test/webpack/package.json` para que quede así (nombre del proyecto
libre):

```json
{
  "name": "ryunix-integration-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ryunix dev",
    "start": "ryunix start",
    "build": "ryunix build"
  },
  "dependencies": {
    "@unsetsoft/ryunixjs": "workspace:*"
  },
  "devDependencies": {
    "@unsetsoft/ryunix-presets": "workspace:*"
  },
  "engines": {
    "node": "^20 || ^22 || ^24"
  }
}
```

| Campo                                        | Significado                                                   |
| :------------------------------------------- | :------------------------------------------------------------ |
| `"@unsetsoft/ryunixjs": "workspace:*"`       | Runtime: código de `packages/core`.                           |
| `"@unsetsoft/ryunix-presets": "workspace:*"` | Tooling: CLI `ryunix` y Webpack de `packages/ryunix-presets`. |
| Scripts `dev` / `build` / `start`            | Los mismos que en una app generada por CRA.                   |

`pnpm-workspace.yaml` en la raíz ya incluye `test/*`, así que pnpm reconoce
`test/webpack` como parte del monorepo.

### 4. Volver a instalar (desde la raíz)

```bash
pnpm install
```

pnpm crea `test/webpack/node_modules/` y enlaza `@unsetsoft/*` a `packages/`.

### 5. Comprobar que el enlace es local

```bash
ls -la test/webpack/node_modules/@unsetsoft/ryunixjs
```

Salida esperada: una flecha o ruta hacia `../../../packages/core` (symlink).
Si es una carpeta copiada sin enlace, revisar el paso 3 y repetir el paso 4.

### 6. Compilar los paquetes del framework

```bash
pnpm build
```

Compila `packages/core` y el resto de paquetes con script `build`. La app en
desarrollo consume el build del core (salida en `packages/core/dist` o la ruta
que defina el paquete).

### 7. Arrancar el servidor de desarrollo

```bash
pnpm run:web
```

Equivale a `pnpm --filter ./test/webpack run dev` → `ryunix dev`. En la
terminal suele indicarse la URL (p. ej. `http://localhost:3000`). Abrirla en el
navegador: debe mostrarse la página de la plantilla `ryunix-base`.

### Resumen visual (primera vez)

```text
pnpm install          → monorepo listo
     ↓
copiar ryunix-base → test/webpack
     ↓
editar package.json (workspace:*)
     ↓
pnpm install          → symlinks en test/webpack/node_modules
     ↓
ls -la …/ryunixjs     → verificar symlink
     ↓
pnpm build            → compilar packages/*
     ↓
pnpm run:web          → navegador
```

---

## Paso a paso: cada sesión de trabajo

Cuando `test/webpack` **ya existe**, el flujo habitual es más corto:

1. **Abrir terminal en la raíz** del monorepo.
2. **`pnpm run:web`** — dejar el proceso en marcha (servidor dev).
3. **Editar código** según el ámbito:

| Se edita…                     | Acción después de guardar                                                                          |
| :---------------------------- | :------------------------------------------------------------------------------------------------- |
| `test/webpack/app/**/*.ryx`   | Nada extra: HMR recarga la página.                                                                 |
| `packages/core/src/**`        | En otra terminal: `pnpm --filter @unsetsoft/ryunixjs build`, luego **recargar** el navegador (F5). |
| `packages/ryunix-presets/**`  | Detener `pnpm run:web` (Ctrl+C) y volver a ejecutarlo.                                             |
| `packages/ryunix-devtools/**` | Recargar la extensión en `chrome://extensions/`.                                                   |

- **Antes de un PR** que toque el core: ejecutar también
  [tests-automatizados.md](./tests-automatizados.md) (`pnpm test`, `pnpm lint`).
- **Commits**: solo `packages/*` y `docs/`; el contenido de `test/webpack` no
  entra en git.

---

## Comandos desde la raíz del monorepo

| Comando              | Qué hace                       | Cuándo usarlo                      |
| :------------------- | :----------------------------- | :--------------------------------- |
| `pnpm run:web`       | `ryunix dev` en `test/webpack` | Desarrollo diario en el navegador  |
| `pnpm run:web:build` | `ryunix build` en la app       | Probar SSG / bundles de producción |
| `pnpm run:web:start` | `ryunix start`                 | Servir build de producción local   |

**Requisito:** existir `test/webpack/package.json` (pasos de la primera vez).

Si `pnpm run:web` falla con «no projects matched», la app no está creada o la
ruta no es `test/webpack`.

---

## Qué hacer según el paquete que se modifique

### `@unsetsoft/ryunix-presets` (Webpack, CLI, routing)

1. `pnpm --filter @unsetsoft/ryunixjs build` (si hubo cambios en core).
2. `pnpm run:web`.
3. Comprobar en la app:

| Área              | Comprobación                                           |
| :---------------- | :----------------------------------------------------- |
| Routing           | Rutas bajo `app/`, `layout.ryx`, `errors.ryx`          |
| Build             | `pnpm run:web:build` sin errores; carpeta `.ryunix/`   |
| SSR / hidratación | Sin errores de hidratación en consola                  |
| API               | `app/api/**/router.js` en dev y tras `build` + `start` |

Docs: [CLI y arranque](../ryunix-presets/cli-y-arranque.md),
[Enrutamiento y SSG](../ryunix-presets/enrutamiento-y-ssg.md).

### `@unsetsoft/ryunix-devtools`

1. App en marcha: `pnpm run:web`.
2. Chrome → `chrome://extensions/` → **Modo de desarrollador** → **Cargar
   extensión sin empaquetar** → carpeta `packages/ryunix-devtools`.
3. F12 → pestaña **Ryunix** → árbol de componentes y props.

Detalle: `packages/ryunix-devtools/README.md`.

### Resumen rápido

| Cambio en…                  | En la app de integración                            |
| :-------------------------- | :-------------------------------------------------- |
| Core (hooks, reconciliador) | `pnpm test` → `build` del core → recargar navegador |
| Presets (Webpack, CLI)      | Reiniciar `pnpm run:web` + checklist arriba         |
| DevTools                    | App + extensión recargada                           |

---

## Crear la app con CRA (alternativa)

En lugar de copiar la plantilla (pasos 2–3 de la primera vez), se puede usar el
generador; luego **hay que** cambiar versiones npm por `workspace:*`.

```bash
mkdir -p test
node packages/cra/src/cli.js test/webpack-app --latest
mv test/webpack-app test/webpack   # si el CLI creó otro nombre
```

Editar `test/webpack/package.json`: sustituir versiones tipo `^1.2.3` de
`@unsetsoft/ryunixjs` y `@unsetsoft/ryunix-presets` por `workspace:*`.
Continuar desde el **paso 4** de [Paso a paso: primera vez](#paso-a-paso-primera-vez).

### ¿`test/webpack` u otra carpeta?

|                              | `test/webpack` (recomendado)     | Carpeta fuera de `test/`              |
| :--------------------------- | :------------------------------- | :------------------------------------ |
| `pnpm run:web` desde la raíz | Sí                               | No (solo `pnpm dev` dentro de la app) |
| `workspace:*` automático     | Sí                               | Configuración manual                  |
| Git                          | Ignorada con el resto de `test/` | Depende de dónde esté                 |

---

## Estructura de la app

```text
test/webpack/
├── app/
│   ├── index.ryx          ← ruta /
│   ├── layout.ryx         ← layout global
│   ├── errors.ryx         ← página de errores
│   └── api/hello/router.js
├── styles/global.css
├── ryunix.config.js
└── package.json           ← workspace:* obligatorio
```

Cada carpeta bajo `app/` define una ruta; componentes usados solo en una ruta
pueden vivir junto a esa ruta.

---

## Git y commits

| Ámbito                | ¿Aparece en `git status`? | Acción                 |
| :-------------------- | :------------------------ | :--------------------- |
| `packages/*`, `docs/` | Sí                        | Commit y PR a `canary` |
| `test/webpack/**`     | No (`.gitignore`)         | Solo entorno local     |

La app de integración es **herramienta personal de desarrollo**, no parte del
código que se publica en el framework.

---

## Documentación relacionada

| Tema                       | Enlace                                                           |
| :------------------------- | :--------------------------------------------------------------- |
| Tests automatizados        | [tests-automatizados.md](./tests-automatizados.md)               |
| Guía del repositorio       | [guia-del-repositorio.md](./guia-del-repositorio.md)             |
| Pila tecnológica y scripts | [pila-tecnologica-y-scripts.md](./pila-tecnologica-y-scripts.md) |
| Índice docs                | [resumen.md](../resumen.md)                                      |
