# Motor interno de Hooks de RyunixJS

RyunixJS implementa un motor de Hooks robusto que acopla estado y efectos
secundarios con elegancia en la arquitectura del árbol Fiber.

En lugar de mantener un array global de estados de forma nativa, cada componente
funcional posee su propio array secuencial `hooks` almacenado internamente en su
instancia Fiber activa. En cada render, `state.hookIndex` se incrementa
dinámicamente para obtener o inicializar el objeto hook correcto.

---

## Índice

- [Motor interno de Hooks de RyunixJS](#motor-interno-de-hooks-de-ryunixjs)
  - [Índice](#índice)
  - [1. Gestión de estado (`hooks.js`)](#1-gestión-de-estado-hooksjs)
  - [2. Pipeline de efectos secundarios (`effects.js`)](#2-pipeline-de-efectos-secundarios-effectsjs)
  - [3. Memoización de rendimiento](#3-memoización-de-rendimiento)
  - [4. Seguridad de entorno y SSR](#4-seguridad-de-entorno-y-ssr)

---

## 1. Gestión de estado (`hooks.js`)

### `useReducer(reducer, initialState, init, defaultPriority)`

El bloque fundamental de toda la gestión de estado en RyunixJS.

- **Estructura del Hook**: Inicializa un objeto

  `{ hookID, type: RYUNIX_STORE, state, queue: [] }`.

- **Encolado y dispatch**: Cuando se llama `dispatch(action)`, la acción se

  empuja a `hook.queue`. Crucialmente, copia `currentState.currentRoot` a
  `wipRoot` y dispara `queueUpdate(() => scheduleWork())` para reiniciar el
  bucle de render con la `Priority` designada.

- **Evaluación**: En el siguiente ciclo de render, cualquier acción almacenada

  dentro del array `queue` se alimenta secuencialmente al reducer para calcular
  el nuevo estado derivado de forma sincrónica antes de reanudar la ejecución.

### `useStore(initialState, priority)`

Conceptualmente idéntico al `useState` de React. Es enteramente un envoltorio
sintáctico alrededor de `useReducer`, empleando un reducer passthrough inline:
`(state, action) => is.function(action) ? action(state) : action`.

---

## 2. Pipeline de efectos secundarios (`effects.js`)

A diferencia del renderizado, que recorre hacia abajo de forma recursiva en un
bucle interrumpible, la fase de ejecución de efectos secundarios ocurre
directamente junto a la fase commit del DOM para controlar estrictamente la
consistencia de la UI.

Ryunix evalúa efectos secundarios de forma eficiente utilizando comprobaciones
de igualdad por referencia en un array de dependencias `deps`.
`haveDepsChanged()` itera `prevDeps` y `nextDeps` aprovechando semántica
`Object.is()` (manejo perfecto de `-0`, `+0` y `NaN`).

### 1. `useLayoutEffect(callback, deps)`

Este hook imita `useEffect`, sin embargo:

- Se ejecuta **de forma sincrónica** durante la fase `commits.js` inmediatamente

  después de actualizar quirúrgicamente los árboles DOM.

- Retrasa intencionalmente el pintado del navegador.
- Garantiza que los desarrolladores puedan invocar recálculos de layout costosos

  (p. ej. `Element.getBoundingClientRect()`) sin exponer jitter de layout sin
  estilo.

### 2. `useEffect(callback, deps)`

- Marca el hook con `RYUNIX_TYPES.RYUNIX_EFFECT`.
- Se ejecuta **de forma asíncrona** después de que el navegador completó su fase

  de pintado (`runNormalEffects`).

- Garantiza que efectos pesados (como E/S de red o suscripciones de polling) no

  bloqueen la UI de responder de inmediato a cambios de estado interactivos.

### Cancelación (`cancelEffects` y `cancelEffectsDeep`)

Cuando un Fiber recibe `EFFECT_TAGS.UPDATE` o `EFFECT_TAGS.DELETION`, RyunixJS
recolecta explícitamente efectos obsoletos:

1. Valida si el `hook.effect` anterior devolvió una función de limpieza

   (`hook.cancel`).

2. Si está disponible, ejecuta la limpieza secuencialmente.
3. Establece automáticamente `hook.cancel = null` para ayudar agresivamente al

   recolector de basura V8 y erradicar fugas de memoria.

---

## 3. Memoización de rendimiento

Para evitar reevaluaciones redundantes del árbol, Ryunix proporciona
bloqueadores de derivación rastreados por dependencias.

### `useMemo(compute, deps)`

Calcula el bloque closure _solo_ si `haveDepsChanged` devuelve true. Si las
variables son estructuralmente idénticas, omite la ejecución y devuelve el
`oldHook.value` en caché, evitando penalizaciones de CPU.

### `useCallback(callback, deps)`

Un patrón de azúcar sintáctico interno superpuesto a `useMemo`. En lugar de
devolver un valor resuelto, devuelve la evaluación de
`useMemo(() => callback, deps)`, ligando rígidamente la identidad de referencia
de la función para evitar re-renders en cascada recursivos en componentes hijo
memoizados.

---

## 4. Seguridad de entorno y SSR

Todos los hooks estándar están completamente protegidos contra peligros del
runtime Node.js. Ryunix impone un límite agresivo
`if (typeof window === "undefined" || state.isServerRendering)`. Cuando los
hooks se ejecutan en el servidor, Ryunix aborta quirúrgicamente el enlace del
dispatcher y devuelve con elegancia una instantánea estática de `initialState` o
`compute()`, prohibiendo fallos de memoria impredecibles en Node.js o
excepciones de runtime `window` indefinido.
