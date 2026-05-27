# Actualizar documentación (RyunixJS)

Comando para **traducir y mantener paridad** entre documentación en español e inglés. Uso principal: **sincronizar la versión EN a partir de ES** (o la inversa si el archivo fuente indicado está en inglés).

Paridad Claude Code: `Ryunixjs/.claude/commands/update-docs.md` (si abres solo el monorepo: `.claude/commands/update-docs.md`).

## Cómo Cursor carga `.cursor/` (leer primero)

| Acción | Qué carga Cursor |
| :--- | :--- |
| **`/update-docs`** | Solo el contenido de **este archivo** (`.cursor/commands/update-docs.md` en la raíz del workspace abierto). |
| **`@.cursor/`** | Los archivos que el usuario adjunte manualmente en el chat; **no** sustituye al slash command ni carga reglas por defecto. |
| **`.cursor/rules/*.mdc`** | Reglas del proyecto cuando aplican por `alwaysApply` o por glob; **no** se inyectan al usar `/update-docs`. |

**Obligatorio para el agente:** seguir las instrucciones de **este** prompt. Si hace falta commit, **leer** con la herramienta Read `Ryunixjs/.cursor/commands/auto-commit.md` o `.cursor/commands/auto-commit.md` (según exista en el workspace).

## Raíz de rutas (obligatorio)

El workspace puede ser la carpeta padre **`ryx/`** (contiene `Ryunixjs/` y `ryunix-doc/`) o el monorepo **`Ryunixjs/`** abierto solo.

Antes de leer o escribir cualquier ruta del mapa, fijar el prefijo del monorepo:

| Condición | Prefijo `MONO` |
| :--- | :--- |
| Existe `Ryunixjs/docs/es/` | `Ryunixjs/` |
| Existe `docs/es/` en la raíz del workspace | `` (vacío) |

Todas las rutas de las tablas siguientes son **relativas al monorepo** → resolver como `{MONO}docs/es/...`, `{MONO}packages/core/...`, etc.

Los README del **workspace** `ryx/` (si existen en la raíz, fuera de `Ryunixjs/`) son un mapa aparte (sección «Raíz del workspace»).

## Cuándo ejecutar

- El usuario invoca **`/update-docs`** o pide traducir / sincronizar docs.
- Tras editar un doc en un idioma y falta la contraparte en el otro.
- **No** editar docs si el usuario no lo pidió (salvo que este comando sea la petición).

## Modos de operación

### 1. Traducción (modo por defecto)

**Sin argumento:** traducir o sincronizar los pares bilingües globales pendientes, empezando por ES → EN si hay desfase.

**Con archivo concreto** (ruta relativa al workspace o al monorepo; aplicar prefijo `MONO` si hace falta):

1. Identificar el par EN ↔ ES del archivo indicado.
2. Tratar el archivo pasado como **fuente**; actualizar su **contraparte** en el otro idioma.
3. Si la contraparte no existe, crearla en la ruta del mapa (abajo).
4. Si el archivo indicado ya está en el idioma destino, usar el par como referencia y sincronizar el otro lado.

Ejemplos:

```text
/update-docs Ryunixjs/docs/es/guias/tests-automatizados.md
  → Ryunixjs/docs/en/guides/automated-testing.md

/update-docs docs/es/guias/tests-automatizados.md
  → docs/en/guides/automated-testing.md   (si el workspace es Ryunixjs/)

/update-docs README.es.md → README.md     (raíz del workspace o MONO según el mapa)
```

**Dirección habitual:** `docs/es/*` → `docs/en/*`. Si el usuario pasa un archivo EN, la dirección es EN → ES.

### 2. Sincronización con el repo (solo si el usuario lo pide)

Activar cuando el usuario indique explícitamente que un doc es **generado por IA**, lleva **fecha de última actualización**, o pide **revisar contra el código** (no solo traducir).

En ese modo:

1. Inspeccionar el código y config real (tabla «Fuentes de verdad»).
2. Corregir el archivo fuente si está desactualizado respecto al repo.
3. Traducir o sincronizar la contraparte bilingüe.
4. Actualizar la fecha de última revisión al final del archivo **solo si el doc ya usa ese pie**; no añadir el pie en docs que no lo tengan salvo petición explícita.

**Prioridad:** traducción fiel del contenido acordado. La revisión contra código es un paso extra, no sustituye la traducción del par.

## Selector de idioma (obligatorio en docs globales)

Al inicio de cada doc bilingüe global, usar **exactamente** este formato:

```markdown
> **Language / Idioma:** [English](./ruta-en.md) · [Español](./ruta-es.md)
```

- Siempre `Language / Idioma` (inglés primero en la etiqueta).
- Enlaces: English · Español.
- Eliminar formas incongruentes: `Spanish version:`, `Equivalente en inglés:`, tablas «Other languages», `Idioma / Language` invertido, etc.

## Mapa de pares EN ↔ ES

Rutas del monorepo: anteponer `MONO` (`Ryunixjs/` en workspace `ryx/`).

### Raíz del workspace `ryx/` (solo si esos archivos están en la raíz del workspace, no dentro de `Ryunixjs/`)

| English | Español |
| :--- | :--- |
| `README.md` | `README.es.md` |

### Raíz del monorepo RyunixJS (`{MONO}`)

| English | Español |
| :--- | :--- |
| `README.md` | `README.es.md` |
| `CONTRIBUTING.md` | `CONTRIBUTING.es.md` |
| `SECURITY.md` | `SECURITY.es.md` |

### Docs globales (`docs/`)

| English | Español |
| :--- | :--- |
| `docs/en/overview.md` | `docs/es/resumen.md` |
| `docs/en/guides/repository-guide.md` | `docs/es/guias/guia-del-repositorio.md` |
| `docs/en/guides/automated-testing.md` | `docs/es/guias/tests-automatizados.md` |
| `docs/en/guides/local-integration-app.md` | `docs/es/guias/app-de-integracion-local.md` |
| `docs/en/guides/tech-stack-and-scripts.md` | `docs/es/guias/pila-tecnologica-y-scripts.md` |

### `core/`

| English | Español |
| :--- | :--- |
| `docs/en/core/virtual-dom-and-reconciliation.md` | `docs/es/core/vdom-y-reconciliacion.md` |
| `docs/en/core/hooks.md` | `docs/es/core/hooks.md` |
| `docs/en/core/rendering.md` | `docs/es/core/renderizado.md` |
| `docs/en/core/state-and-priority.md` | `docs/es/core/estado-y-prioridad.md` |
| `docs/en/core/advanced-components.md` | `docs/es/core/componentes-avanzados.md` |
| `docs/en/core/components.md` | `docs/es/core/componentes.md` |
| `docs/en/core/server-features.md` | `docs/es/core/funciones-servidor.md` |
| `docs/en/core/error-boundary.md` | `docs/es/core/limites-de-error.md` |
| `docs/en/core/devtools-and-profiler.md` | `docs/es/core/devtools-y-profiler.md` |

### `ryunix-presets/`

| English | Español |
| :--- | :--- |
| `docs/en/ryunix-presets/cli-and-bootstrapping.md` | `docs/es/ryunix-presets/cli-y-arranque.md` |
| `docs/en/ryunix-presets/configuration-loading.md` | `docs/es/ryunix-presets/carga-de-configuracion.md` |
| `docs/en/ryunix-presets/routing-and-ssg.md` | `docs/es/ryunix-presets/enrutamiento-y-ssg.md` |
| `docs/en/ryunix-presets/api-router.md` | `docs/es/ryunix-presets/enrutador-api.md` |
| `docs/en/ryunix-presets/webpack-loaders.md` | `docs/es/ryunix-presets/loaders-webpack.md` |
| `docs/en/ryunix-presets/file-based-errors.md` | `docs/es/ryunix-presets/errores-por-archivo.md` |

### `cra/`

| English | Español |
| :--- | :--- |
| `docs/en/cra/cli-and-helpers.md` | `docs/es/cra/cli-y-ayudantes.md` |
| `docs/en/cra/template-generation.md` | `docs/es/cra/generacion-de-plantillas.md` |

Tras crear un doc nuevo en un idioma, añadir la fila al mapa en **este comando** y actualizar `docs/en/overview.md` / `docs/es/resumen.md`.

## Fuentes de verdad (modo sincronización con repo)

Usar solo en modo 2 o cuando el contenido traducido deba reflejar el código actual.

| Área | Dónde mirar |
| :--- | :--- |
| Runtime (hooks, render, SSR) | `packages/core/src/lib/`, `packages/core/package.json` |
| API pública del core | `packages/core/src/lib/index.js`, `packages/core/README.md` |
| Tooling y CLI | `packages/ryunix-presets/webpack/bin/`, `packages/ryunix-presets/package.json` |
| Routing / SSG / API | `packages/ryunix-presets/webpack/utils/` |
| Plantillas de apps | `packages/cra/templates/ryunix-base/` |
| Scaffolding CRA | `packages/cra/src/` |
| DevTools | `packages/ryunix-devtools/` |
| Scripts del monorepo | `package.json` raíz, `turbo.json`, `pnpm-workspace.yaml` |
| Contribución | `CONTRIBUTING.md`, `README.md` |

## Reglas de traducción y redacción

- **Tono documental:** impersonal, factual; no dirigirse al lector («cuando un mantenedor dice…», «tu app», «usa…»).
- **Paridad estructural:** mismos encabezados, tablas, bloques de código y enlaces relativos adaptados al idioma destino.
- **No inventar** APIs, carpetas o comandos que no existan en el repo.
- **No traducir** identificadores de código (`useStore`, `ryunix dev`, rutas de archivos) salvo prosa alrededor.
- **No documentar** secretos (`.env`, tokens).
- Mantener nombres de archivo en español bajo `docs/es/` (p. ej. `tests-automatizados.md`, no `automated-testing.md` en ES).
- Rutas obsoletas a corregir si aparecen: `packages/ryunix` → `packages/core`; Next.js (`page.tsx`, `next dev`) → Ryunix (`.ryx`, `ryunix dev`); `useState` → `useStore` en ejemplos del core.

## Proceso para el agente

### Traducción (modo 1)

0. **Calcular `MONO`** (sección «Raíz de rutas»). Si una ruta del usuario no existe, reintentar con `{MONO}` + ruta.
1. Resolver el par EN ↔ ES (mapa o argumento del usuario).
2. Leer el archivo **fuente** completo.
3. Traducir / sincronizar la **contraparte** preservando estructura y enlaces.
4. Añadir o corregir el selector `Language / Idioma` en ambos archivos del par.
5. Si el doc nuevo es global, enlazarlo desde `docs/en/overview.md` y `docs/es/resumen.md`.
6. No modificar código en `packages/` salvo petición explícita.

### Sincronización con repo (modo 2)

1. Pasos 1–4 del modo traducción.
2. Contrastar afirmaciones técnicas con «Fuentes de verdad».
3. Corregir desfases en fuente y contraparte.
4. Actualizar índices si cambió la lista de documentos.

## Commits de documentación

Si el usuario pide commit, **leer** `Ryunixjs/.cursor/commands/auto-commit.md` o `.cursor/commands/auto-commit.md` y aplicar sus reglas:

```text
docs(guide): sync automated-testing EN with tests-automatizados ES

docs(es): translate repository guide updates to guia-del-repositorio
```

Scopes útiles: `readme`, `guide`, `core`, `presets`, `cra`, `cursor`, `claude`, `ci`.

## Resumen para el agente

- **Uso normal:** traducir el par bilingüe; fuente habitual ES → EN.
- **Con archivo:** el argumento es la fuente; actualizar la contraparte del mapa.
- **Con «IA / fecha / revisar repo»:** traducir y además validar contra el código.
- Mantener selector `Language / Idioma` y tono documental en toda doc global.
