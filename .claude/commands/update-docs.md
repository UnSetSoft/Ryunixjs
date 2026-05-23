---
description: Traducir y sincronizar docs ES ↔ EN (habitualmente ES → EN)
argument-hint: [ruta-al-archivo-fuente | revisar-contra-repo]
---

# Actualizar documentación (RyunixJS)

Comando para **traducir y mantener paridad** entre documentación en español e inglés. Uso principal: **sincronizar la versión EN a partir de ES** (o la inversa si el archivo fuente indicado está en inglés).

Paridad Cursor: `.cursor/commands/update-docs.md`.

## Cuándo ejecutar

- **`/update-docs`** o petición explícita de traducir / sincronizar docs.
- Tras editar un doc en un idioma y falta la contraparte en el otro.
- **No** editar docs sin petición (salvo este comando).

## Modos de operación

### 1. Traducción (modo por defecto)

**Sin argumento:** traducir o sincronizar los pares bilingües globales pendientes, empezando por ES → EN si hay desfase.

**Con archivo concreto** (`$ARGUMENTS` = ruta relativa al repo):

1. Identificar el par EN ↔ ES del archivo indicado.
2. Tratar el archivo pasado como **fuente**; actualizar su **contraparte** en el otro idioma.
3. Si la contraparte no existe, crearla en la ruta del mapa (abajo).
4. Si el archivo indicado ya está en el idioma destino, usar el par como referencia y sincronizar el otro lado.

Ejemplos:

```text
/update-docs docs/es/guias/guia-de-pruebas.md     → actualiza docs/en/guides/testing-guide.md
/update-docs docs/en/guides/repository-guide.md    → actualiza docs/es/guias/guia-del-repositorio.md
/update-docs README.es.md                   → actualiza README.md
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

```markdown
> **Language / Idioma:** [English](./ruta-en.md) · [Español](./ruta-es.md)
```

Eliminar formas incongruentes: `Spanish version:`, `Equivalente en inglés:`, tablas «Other languages», etc.

## Mapa de pares EN ↔ ES

### Raíz

| English | Español |
| :--- | :--- |
| `README.md` | `README.es.md` |
| `CONTRIBUTING.md` | `CONTRIBUTING.es.md` |
| `SECURITY.md` | `SECURITY.es.md` |

### Docs globales

| English | Español |
| :--- | :--- |
| `docs/en/overview.md` | `docs/es/resumen.md` |
| `docs/en/guides/repository-guide.md` | `docs/es/guias/guia-del-repositorio.md` |
| `docs/en/guides/testing-guide.md` | `docs/es/guias/guia-de-pruebas.md` |
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

## Fuentes de verdad (modo sincronización con repo)

| Área | Dónde |
| :--- | :--- |
| Runtime | `packages/core/src/lib/`, `packages/core/package.json` |
| API pública | `packages/core/src/lib/index.js` |
| Tooling | `packages/ryunix-presets/webpack/bin/` |
| Routing / SSG | `packages/ryunix-presets/webpack/utils/` |
| Plantillas | `packages/cra/templates/ryunix-base/` |
| CRA | `packages/cra/src/` |
| Scripts | `package.json` raíz, `turbo.json`, `pnpm-workspace.yaml` |

## Reglas de traducción

- Tono documental, impersonal; no dirigirse al lector.
- Paridad estructural entre pares EN ↔ ES.
- No inventar APIs ni rutas inexistentes.
- Nombres de archivo en español bajo `docs/es/`.
- Rutas obsoletas: `packages/ryunix` → `packages/core`; Next.js → Ryunix; `useState` → `useStore` en ejemplos del core.

## Proceso

### Modo traducción

1. Resolver par EN ↔ ES (mapa o `$ARGUMENTS`).
2. Leer archivo **fuente**; traducir **contraparte**.
3. Selector `Language / Idioma` en ambos archivos.
4. Actualizar índices si aplica.

### Modo sincronización con repo

1. Pasos del modo traducción.
2. Contrastar con fuentes de verdad; corregir desfases.

## Commits

```text
docs(guide): sync testing guide EN with guia-de-pruebas ES
```

Si el usuario pide commit: `/auto-commit`.

$ARGUMENTS
