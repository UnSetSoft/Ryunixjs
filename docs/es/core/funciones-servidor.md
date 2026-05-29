# Funciones de servidor y puente de arquitectura de RyunixJS

Ryunix va más allá del renderizado exclusivamente en cliente integrando de forma
nativa patrones para capacidades del lado servidor. Este documento desvela la
mecánica de Server Actions y el puente interno.

---

## Índice

- [Funciones de servidor y puente de arquitectura de RyunixJS](#funciones-de-servidor-y-puente-de-arquitectura-de-ryunixjs)
  - [Índice](#índice)
  - [1. Server Actions (`serverActions.js`)](#1-server-actions-serveractionsjs)
  - [2. Server Boundary (`serverBoundary.js`)](#2-server-boundary-serverboundaryjs)
  - [3. El puente de dependencias (`bridge.js`)](#3-el-puente-de-dependencias-bridgejs)

---

## 1. Server Actions (`serverActions.js`)

Ryunix permite que funciones ejecutadas en el servidor se disparen sin problemas
desde el navegador cliente sin escribir manualmente envoltorios HTTP `fetch`.

Esto depende fundamentalmente de transformaciones de compilación (p. ej.
`ryunix-server-action-loader.mjs`) que eliminan físicamente el payload de lógica
del lado servidor del bundle y lo sustituyen por un proxy cliente.

### `createActionProxy(actionId)`

Cuando el compilador sustituye una función `use server` en el bundle cliente,
inyecta `createActionProxy("unique-action-id")`. Al ejecutarse en el navegador:

1. Los argumentos se serializan estrictamente con `JSON.stringify`.
2. Se dispara una petición HTTP `POST` asíncrona al endpoint configurado

   `/_ryunix/action`.

3. La petición incluye de forma única cabeceras `X-Ryunix-Action` para reforzar

   límites de seguridad CSRF de forma activa.

4. Si tiene éxito, el JSON se resuelve recursivamente en la lógica del

   componente.

---

## 2. Server Boundary (`serverBoundary.js`)

Al construir arquitecturas de Server Components, secciones del Virtual DOM se
renderizan estrictamente en el servidor Node.js. Cuando arranca el cliente,
intenta «hidratar» el HTML, es decir, evalúa su propio Virtual DOM y lo empareja
con el DOM. Si el cliente no conoce los componentes solo-servidor, los
eliminaría de forma destructiva.

### Componente `ServerBoundary`

Ryunix inyecta `<ServerBoundary id="...">` como envoltorio protector alrededor
de cadenas de contenido solo-servidor.

- En el cliente, este componente se evalúa de forma extremadamente lazy,

  devolviendo un simple
  `<div data-ryunix-server="id" style="display: contents">`.

- Durante la hidratación, el reconciliador (`fiber-update.js`) **no reconcilia
  hijos** bajo este nodo y avanza el cursor de hidratación más allá del markup
  preservado del servidor.

- `ServerBoundary` **no** es un objetivo de recovery de hidratación (a
  diferencia de `HydrationBoundary`).

---

## 3. El puente de dependencias (`bridge.js`)

Debido al acoplamiento modular estricto de la máquina de estados interna de
Ryunix, `hooks.js` y `workers.js` dependen técnicamente uno del otro.

- `hooks.js` requiere `scheduleWork` de `workers.js` para despachar

  actualizaciones de estado.

- `workers.js` necesita iterar índices de Hook de forma agresiva.

### Ruptura de dependencia circular

`bridge.js` actúa como puntero de memoria intermediario:

1. `hooks.js` importa `scheduleWork` del Bridge de forma estática.
2. Durante la inicialización, `workers.js` ejecuta

   `setScheduleWork(scheduleWork)` enlazando físicamente su referencia interna
   de función Work Loop dentro de la memoria del closure del Bridge.

3. Esto elimina por completo las restricciones de importación cíclica de

   JavaScript manteniendo seguridad de tipos estricta a través de los límites
   del motor.
