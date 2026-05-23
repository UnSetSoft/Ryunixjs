# Arquitectura de estado y cola de prioridad de RyunixJS

Ryunix incorpora un motor de batching basado en prioridad personalizado que
controla exactamente _cuándo_ el virtual DOM reevalúa componentes específicos.

Al organizar actualizaciones de forma asíncrona, Ryunix garantiza que las
interacciones de usuario de alta prioridad (escribir, hacer clic) interrumpan y
suspendan trabajo de baja prioridad (obtención de datos, sincronizaciones en
segundo plano).

---

## Índice

- [Arquitectura de estado y cola de prioridad de RyunixJS](#arquitectura-de-estado-y-cola-de-prioridad-de-ryunixjs)
  - [Índice](#índice)
  - [1. Batching (`batching.js`)](#1-batching-batchingjs)
  - [2. Programación por prioridad (`priority.js`)](#2-programación-por-prioridad-priorityjs)

---

## 1. Batching (`batching.js`)

Las actualizaciones de estado en Ryunix se agrupan por defecto para reducir
drásticamente ciclos de render innecesarios.

### El problema

Si un componente invoca `setState(1)`, `setState(2)` y `setState(3)`
consecutivamente dentro de un bloque sincrónico, un framework ingenuo dispara 3
recorridos completos del árbol Fiber.

### La solución: `queueUpdate(update)`

Cuando `dispatch` es llamado internamente por `useStore` o `useReducer`, no
arranca directamente el Work Loop. En su lugar, inserta el closure de
programación de trabajo en `pendingUpdates.push(update)`.

### `batchUpdates(callback)`

Cuando Ryunix ejecuta eventos sintéticos (p. ej. `onClick`), envuelve
automáticamente el manejador dentro de `batchUpdates`.

1. Marca `isBatching = true`.
2. Evalúa la lógica del manejador. Cualquier render posterior se intercepta y se

   encola estrictamente.

3. Una vez finaliza la ejecución sincrónica, desmarca el flag con seguridad y

   ejecuta `flushUpdates()` recorriendo la cola como un único commit
   consolidado.

---

## 2. Programación por prioridad (`priority.js`)

No todas las actualizaciones de estado tienen la misma urgencia.

### Niveles de prioridad

1. **`IMMEDIATE`**: Entrada directa del usuario que dicta estrictamente la

   interactividad física (teclas pulsadas, seguimiento del ratón).

2. **`USER_BLOCKING`**: Acciones responsivas donde el usuario espera feedback

   visual instantáneo pero el navegador no colapsará si se retrasa mucho
   (scroll, animaciones hover).

3. **`NORMAL`**: Fallback por defecto. Obtenciones de datos estándar,

   navegaciones de ruta.

4. **`LOW`**: Derivaciones de estado en segundo plano o procesos de seguimiento

   analítico.

5. **`IDLE`**: Acciones empujadas con seguridad a ciclos completamente idle del

   navegador.

### `scheduleUpdate(callback, priority)`

Empuja un envoltorio de actualización que contiene un flag numérico `priority` a
`pendingUpdates`.

### `processPendingUpdates(deadline)`

Ryunix utiliza `requestIdleCallback(processPendingUpdates)` (rIC). Cuando el
navegador señala que tiene un frame CPU idle, Ryunix ejecuta:

1. `pendingUpdates.sort((a, b) => a.priority - b.priority)`: Los arrays se

   reordenan dinámicamente para que trabajos `IMMEDIATE` y `USER_BLOCKING`
   salten al frente de la cola.

2. El bucle consume actualizaciones exactamente en secuencia de prioridad,

   terminando agresivamente si `deadline.timeRemaining()` indica que la ventana
   de framing de 16 ms se agotó para evitar perder frames visuales.

### `useTransition` y `useDeferredValue`

Estos hooks exponen el planificador de prioridad interno a los desarrolladores.
Invocar actualizaciones de estado envueltas dentro de una transición degrada
explícitamente su flag de ejecución a `Priority.LOW`. Esto impone que entradas
de escritura rápidas subsiguientes (`Priority.IMMEDIATE`) preempten y cancelen
repetidamente el render en segundo plano de listas pesadas.
