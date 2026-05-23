# Arquitectura de Virtual DOM y reconciliación de RyunixJS

RyunixJS opera sobre una **arquitectura de renderizado concurrente basada en
Fiber**. Este diseño divide la carga de renderizado en unidades pequeñas e
interrumpibles, garantizando que árboles de componentes profundamente anidados
no bloqueen el hilo principal, manteniendo una interfaz de usuario fluida.

Este documento sirve como referencia interna para que los mantenedores entiendan
cómo se crean, procesan, reconcilian y finalmente pintan los elementos en el
DOM.

---

## Índice

- [Arquitectura de Virtual DOM y reconciliación de RyunixJS](#arquitectura-de-virtual-dom-y-reconciliación-de-ryunixjs)
  - [Índice](#índice)
  - [1. Creación de elementos (`createElement.js`)](#1-creación-de-elementos-createelementjs)
  - [2. Work Loop y concurrencia (`workers.js` y `priority.js`)](#2-work-loop-y-concurrencia-workersjs-y-priorityjs)
  - [3. El Reconciler (`reconciler.js`)](#3-el-reconciler-reconcilerjs)
  - [4. Mutación del DOM (`dom.js` y `commits.js`)](#4-mutación-del-dom-domjs-y-commitsjs)

---

## 1. Creación de elementos (`createElement.js`)

Todo comienza cuando JSX se transpila en llamadas `createElement`.

### `createElement(type, props, ...children)`

Construye un elemento Virtual DOM de Ryunix (definición de nodo Fiber).

- **Normalización**: Aplana el array `children` y filtra valores null, booleanos

  e undefined.

- **Nodos de texto**: Cadenas o números consecutivos se concatenan y pasan por

  `createTextElement(text)` para garantizar que el árbol solo contenga objetos
  Ryunix uniformes `{ type, props }`.

### `Fragment(props)`

Un componente integrado que devuelve un tipo especial
`RYUNIX_TYPES.RYUNIX_FRAGMENT`. Permite agrupar varios hijos sin envolverlos en
un nodo DOM extra.

---

## 2. Work Loop y concurrencia (`workers.js` y `priority.js`)

RyunixJS evita bloquear el navegador dividiendo el trabajo en fragmentos usando
la API `requestIdleCallback` (rIC) o microtareas según la `Priority` actual.

### `scheduleWork(root, priority)`

Empuja una nueva raíz de renderizado a `workQueue` o la establece de inmediato
como `nextUnitOfWork`. Tareas de alta prioridad disparan un frame sintético vía
microtareas (`Promise.resolve().then()`), mientras que tareas de baja prioridad
ceden a la inactividad estándar del navegador vía `rIC`.

### `workLoop(deadline)`

El corazón del motor. Procesa continuamente `state.nextUnitOfWork` mientras
`deadline.timeRemaining() > 1`. Si el trabajo termina (es decir,
`nextUnitOfWork` pasa a null), dispara de forma sincrónica `commitRoot()`.

### `performUnitOfWork(fiber)`

Evalúa un único nodo Fiber:

1. Llama funciones de componente (`updateFunctionComponent`) o inicializa nodos

   host (`updateHostComponent`).

2. Genera los fibers hijos mediante el **Reconciler**.
3. Desciende a `fiber.child`.
4. Si no hay hijo, pasa a `fiber.sibling`.
5. Si no hay sibling, sube a `fiber.parent.sibling`, recorriendo hacia arriba

   hasta procesar el árbol por completo.

#### Recuperación de errores

Si un componente lanza un error durante `performUnitOfWork`, el bucle sube
buscando una etiqueta de cadena `RYUNIX_ERROR_BOUNDARY`. Si la encuentra,
elimina la rama corrupta, adjunta `stateError` al fiber del boundary y rebobina
con seguridad el cursor del árbol para reintentar renderizar la UI fallback del
boundary.

---

## 3. El Reconciler (`reconciler.js`)

Una vez generados los hijos, el Reconciler decide si crear nuevos fibers,
actualizar los existentes o marcar fibers antiguos para eliminación.

### `reconcileChildren(wipFiber, elements)`

- Itera los hijos antiguos adjuntos a `wipFiber.alternate.child`.
- **Optimización Map O(1)**: Construye un `Map` de JavaScript de fibers antiguos

  utilizando su prop declarativo explícito `key`, o por defecto secuencialmente
  `__index_${position}__`.

- Al evaluar elementos nuevos, el algoritmo comprueba el `Map` en tiempo

  constante:
  - **Coincidencia (mismo tipo y key)**: Reutiliza el nodo DOM existente, marca

    `EFFECT_TAGS.UPDATE`.

  - **Sin coincidencia**: Crea un fiber nuevo, marca `EFFECT_TAGS.PLACEMENT` (o

    `HYDRATE` si el emparejamiento SSR está activo).

  - **Nodos huérfanos**: Cualquier fiber antiguo que quede en el Map tras

    parsear los elementos nuevos se marca con `EFFECT_TAGS.DELETION` y se empuja
    al array `state.deletions`.

---

## 4. Mutación del DOM (`dom.js` y `commits.js`)

La fase commit es completamente sincrónica y no puede interrumpirse. Esto
garantiza que las actualizaciones visuales se pinten en un único frame atómico.

### `commitRoot()`

1. Ejecuta `commitWork` para todos los fibers en `state.deletions`.
2. Intercambia los punteros del árbol activo

   (`state.currentRoot = finishedWork`).

3. Ejecuta `commitWork(finishedWork.child)` recursivamente para el árbol.
4. Limpia cursores de hidratación SSR obsoletos.

### `commitWork(fiber)`

Aplica las mutaciones DOM correspondientes al ancestro padre más cercano que
contiene un nodo DOM físico.

- **`PLACEMENT`**: Añade el nodo vía `domParent.appendChild`.
- **`UPDATE`**: Muta atributos vía `updateDom(dom... )`.
- **`DELETION`**: Limpia efectos con seguridad y llama `removeChild`.
- **`HYDRATE`**: Adjunta silenciosamente listeners de eventos y propiedades al

  HTML de servidor SSR existente sin destruirlo.

### Pipeline de efectos

Dentro del recorrido commit:

1. `runLayoutEffects` barre de forma sincrónica tras la mutación DOM.
2. `cancelEffects` (limpieza) ocurre antes de la actualización.
3. `runNormalEffects` se ejecuta con elegancia tras el pintado.

### `updateDom(dom, prevProps, nextProps)`

Hace diff de propiedades de objeto dinámicamente:

- Muta estilos CSS inline mapeando CamelCase a Kebab-Case.
- Envuelve eventos (`onClick` -> `click`) internamente dentro de

  `dom._ryunixHandlers` para permitir recolección de basura fiable y llamadas
  `removeEventListener` dirigidas.

- Inyecta un filtro de seguridad `validateUri()` contra protocolos peligrosos

  estándar (`javascript:`, `data:`, `vbscript:`) en propiedades como `href`.
