# Componentes integrados de Ryunix

Ryunix incluye varios componentes nativos que se conectan directamente a las
fases del reconciler de la arquitectura.

---

## Índice

- [Componentes integrados de Ryunix](#componentes-integrados-de-ryunix)
  - [Índice](#índice)
  - [Manejo de límites de componentes](#manejo-de-límites-de-componentes)
  - [Carga asíncrona](#carga-asíncrona)
  - [Ámbitos avanzados](#ámbitos-avanzados)

---

## Manejo de límites de componentes

### `<ErrorBoundary />`

Un componente nativo de Ryunix que captura errores de JavaScript lanzados en
cualquier parte del árbol de componentes hijo.

- Opera dentro del bucle `performUnitOfWork` (`workers.js`).
- Si se captura una excepción no manejada durante el render, el reconciler sube

  por la cadena `fiber.parent` buscando `RYUNIX_ERROR_BOUNDARY`.

- Poda dinámicamente los hijos corruptos, establece `stateError` dentro del

  fiber y rebobina el puntero `wipFiber` para que el bucle se recupere con
  seguridad y muestre la prop `fallback`.

### `<ServerBoundary />`

Se usa para proteger exclusivamente contenido renderizado en el servidor durante
la hidratación parcial.

- Se usa ampliamente con Island Architecture (`hydrateIslands()`).
- Los hijos dentro de un Server Boundary son ignorados por la app del lado

  cliente, evitando desajustes de hidratación en nodos inherentemente
  dependientes del servidor (como markdown dinámico o listas de base de datos
  que no necesitan interactividad).

## Carga asíncrona

### `lazy(importFn)`

Crea un `LazyComponent` que actúa como envoltorio para code splitting dinámico
(`import()`).

- Tiene tres estados internos: `PENDING`, `RESOLVED`, `REJECTED`.
- Dispara un `forceUpdate` sincrónico cuando el chunk del módulo termina de

  descargarse por la red.

### `<Suspense />`

Encaja perfectamente con `lazy()`. Detecta si algún elemento hijo dentro de su
árbol sigue internamente en `PENDING`.

- Si es así, renderiza de inmediato la UI esqueleto `fallback`.
- Muy potente junto con Server-Side-Rendering (`renderToReadableStream`). Delega

  la carga lazy a una Promise en segundo plano y transmite el fallback de
  inmediato; lo sustituye mediante reemplazo con `<template>` cuando la tarea
  del servidor finaliza.

### `preload(importFn)`

Función de utilidad que invoca de inmediato la obtención del chunk. Puede
dispararse en eventos hover mediante cabeceras `Link` antes de que el usuario
haga clic.

## Ámbitos avanzados

### `<MDXContent />` y `<MDXProvider />`

Soporte nativo para compilación MDX.

- Inyecta un contexto con un mapa `defaultComponents` que alias estándar de

  etiquetas HTML (`<h1>`, `<p>`, etc.) directamente a nodos host de
  `createElement` de Ryunix.

- Expone `getMDXComponents()` para permitir sobrecargas en runtime de cabeceras

  o componentes de resaltado de sintaxis.

### `createPortal(children, container)`

Marcado con el símbolo `RYUNIX_PORTAL`. Indica a la fase Commit (`commitWork()`)
que abandone el append lógico padre-hijo estándar y mapee directamente los nodos
DOM `children` construidos en un `portalContainer` secundario ubicado en
cualquier parte de la página (excelente para modales y tooltips de z-index
superior).
