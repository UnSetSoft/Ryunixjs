# Arquitectura de renderizado de RyunixJS

RyunixJS proporciona un sistema de renderizado unificado capaz de ejecutarse de
forma idéntica tanto en el navegador (renderizado en cliente) como en entornos
Node.js/Edge (renderizado en servidor).

Este documento detalla los mecanismos exactos y los puntos de entrada
responsables de convertir elementos Ryunix en píxeles físicos o cadenas HTML en
bruto.

---

## Índice

- [Arquitectura de renderizado de RyunixJS](#arquitectura-de-renderizado-de-ryunixjs)
  - [Índice](#índice)
  - [1. Renderizado en cliente (`render.js`)](#1-renderizado-en-cliente-renderjs)
  - [2. Renderizado en servidor (`ssr.ts`)](#2-renderizado-en-servidor-ssrts)

---

## 1. Renderizado en cliente (`render.js`)

Los puntos de entrada del entorno del navegador gestionan la inicialización del
Root de la aplicación.

### `init(MainElement, rootId)`

La función bootstrap inteligente. `init` detecta automáticamente si el
contenedor DOM objetivo tiene hijos ya renderizados en servidor.

- **SSR detectado**: Transiciona con elegancia a `hydrate()` para adjuntar

  listeners de eventos sin destruir el markup existente.

- **Contenedor vacío**: Recurre al `render()` estándar.
- _Nota_: Los desarrolladores pueden forzar un render completo en cliente

  omitiendo la hidratación pasando `process.env.RYUNIX_SSR = 'false'`.

### `render(element, container)`

Realiza un renderizado en cliente (CSR) destructivo.

1. Llama a `clearContainer(container)` para eliminar cualquier HTML interno

   existente.

2. Inicializa un Fiber `wipRoot` sintético mapeado al nodo DOM físico

   `container`.

3. Invoca `scheduleWork(root)` para encender el bucle concurrente de

   `workers.js`.

### `hydrate(element, container)`

Adjunta el motor RyunixJS a HTML precompilado enviado desde el servidor.

1. Deja los nodos DOM existentes completamente intactos.
2. Calcula el `nextValidSibling` lógico atravesando saltos de línea de texto o

   comentarios HTML.

3. Establece `state.isHydrating = true` y `state.hydrateCursor` para rastrear la

   posición.

4. Inicializa `scheduleWork(root)`.
5. **Seguridad de fallback**: Si la hidratación falla (UI desincronizada), la

   fase commit de Ryunix (`commits.js`) detecta la desincronización
   (`state.hydrationFailed`), elimina el contenedor y fuerza un `PLACEMENT` CSR
   nativo para garantizar que la aplicación siga siendo estrictamente usable.

---

## 2. Renderizado en servidor (`ssr.ts`)

Implementación en `packages/core/src/lib/server/ssr.ts`. El parser del servidor
funciona de forma sincrónica (`renderToString`) o asíncrona con streams
(`renderToReadableStream` / `renderToStringAsync`), cortocircuitando hooks con
`state.isServerRendering = true` y reseteando `ssrMetadata` / `ssrContexts` al
inicio de cada render.

### `renderToString(element)`

Render sincrónico para árboles sin componentes async ni Suspense streaming.
Devuelve error si un componente devuelve `Promise` (usar `renderToStringAsync`).

### `renderToStringAsync(element)`

Atajo sobre `renderToReadableStream`; camino usado por el App Router en SSG/SSR
dev.

### `renderToReadableStream(element)`

La implementación insignia de streaming con desbloqueo automático de
`<RYUNIX_SUSPENSE>`. Devuelve un `ReadableStream` nativo que permite a los
servidores HTTP transmitir cabeceras y chunks al instante antes de que la CPU
termine de evaluar el documento completo.

#### Streaming asíncrono de Suspense internamente

1. Empuja `<template id="B:uuid">` y fallbacks por el pipe HTTP al instante.
2. Inicia tareas evaluadas en segundo plano asíncronas (`suspenseTasks`) para

   rutas lazy que obtienen datos.

3. Cuando el componente asíncrono finaliza, Ryunix empuja el HTML completado

   dentro de un `<template>` junto con un pequeño script evaluador Javascript
   inline (`$RC("S:uuid", "P:uuid")`).

4. El navegador del cliente analiza el script y sustituye con seguridad el

   loader fallback por el contenido recuperado de forma progresiva.
