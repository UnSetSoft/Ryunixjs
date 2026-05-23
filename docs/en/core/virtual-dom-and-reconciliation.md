# RyunixJS Virtual DOM & Reconciliation Architecture

RyunixJS operates on a **Fiber-based, concurrent rendering architecture**. This
design splits the rendering workload into small, interruptible units, ensuring
that deeply nested component trees do not block the main thread, maintaining a
fluid User Interface.

This document serves as an internal reference for maintainers to understand how
elements are created, processed, reconciled, and finally painted to the DOM.

---

## Table of contents

- [RyunixJS Virtual DOM & Reconciliation Architecture](#ryunixjs-virtual-dom--reconciliation-architecture)
  - [Table of contents](#table-of-contents)
  - [1. Element Creation (`createElement.js`)](#1-element-creation-createelementjs)
  - [2. Work Loop & Concurrency (`workers.js` & `priority.js`)](#2-work-loop--concurrency-workersjs--priorityjs)
  - [3. The Reconciler (`reconciler.js`)](#3-the-reconciler-reconcilerjs)
  - [4. DOM Mutation (`dom.js` & `commits.js`)](#4-dom-mutation-domjs--commitsjs)

---

## 1. Element Creation (`createElement.js`)

Everything begins when JSX is transpiled into `createElement` calls.

### `createElement(type, props, ...children)`

Constructs a Ryunix Virtual DOM element (Fiber node definition).

- **Normalization**: It flattens the `children` array and filters out null,

  booleans, and undefined values.

- **Text Nodes**: Consecutive strings or numbers are concatenated and passed

  through `createTextElement(text)` to ensure the tree only contains uniform
  Ryunix Objects `{ type, props }`.

### `Fragment(props)`

A built-in component that returns a special type `RYUNIX_TYPES.RYUNIX_FRAGMENT`.
It allows grouping multiple children without wrapping them in an extra DOM node.

---

## 2. Work Loop & Concurrency (`workers.js` & `priority.js`)

RyunixJS avoids blocking the browser by breaking work down into chunks using the
`requestIdleCallback` (rIC) API or microtasks based on the current `Priority`.

### `scheduleWork(root, priority)`

Pushes a new rendering root to the `workQueue` or immediately sets it as the
`nextUnitOfWork`. High priority tasks trigger a synthetic frame via microtasks
(`Promise.resolve().then()`), while low priority tasks yield to standard browser
idleness via `rIC`.

### `workLoop(deadline)`

The engine's beating heart. It continuously processes the `state.nextUnitOfWork`
while `deadline.timeRemaining() > 1`. If the work finishes (i.e.,
`nextUnitOfWork` becomes null), it synchronously triggers `commitRoot()`.

### `performUnitOfWork(fiber)`

Evaluates a single Fiber node:

1. Calls component functions (`updateFunctionComponent`) or initializes host

   nodes (`updateHostComponent`).

2. Generates the children fibers via the **Reconciler**.
3. Traverses downwards to `fiber.child`.
4. If no child, moves to `fiber.sibling`.
5. If no sibling, moves to `fiber.parent.sibling`, traversing upwards until the

   tree is fully processed.

#### Error Recovery

If a component throws an error during `performUnitOfWork`, the loop traverses
upwards looking for a `RYUNIX_ERROR_BOUNDARY` string tag. If found, it drops the
corrupted branch, attaches the `stateError` to the boundary fiber, and safely
rewinds the tree cursor to retry rendering the boundary's fallback UI.

---

## 3. The Reconciler (`reconciler.js`)

Once children are generated, the Reconciler decides whether to create new
fibers, update existing ones, or mark old fibers for deletion.

### `reconcileChildren(wipFiber, elements)`

- Iterates through the old children attached to `wipFiber.alternate.child`.
- **O(1) Map Optimization**: It constructs a JavaScript `Map` of old fibers

  utilizing their explicit declarative `key` prop, or sequentially defaults to
  `__index_${position}__`.

- As new elements are evaluated, the algorithm checks the `Map` in constant time

  constraints:
  - **Match Found (Same Type & Key)**: Re-uses the existing DOM node, stamps the

    `EFFECT_TAGS.UPDATE`.

  - **No Match**: Creates a brand new fiber, stamps `EFFECT_TAGS.PLACEMENT` (or

    `HYDRATE` if SSR matching is active).

  - **Stranded Nodes**: Any old fiber left in the Map after the new elements are

    parsed is stamped with `EFFECT_TAGS.DELETION` and pushed to the
    `state.deletions` array.

---

## 4. DOM Mutation (`dom.js` & `commits.js`)

The commit phase is completely synchronous and cannot be interrupted. This
guarantees that visual updates are painted to the screen in a single atomic
frame.

### `commitRoot()`

1. Executes `commitWork` for all fibers stored in `state.deletions`.
2. Interchanges the active tree pointers (`state.currentRoot = finishedWork`).
3. Executes `commitWork(finishedWork.child)` recursively for the tree.
4. Cleans up stale SSR hydrate cursors.

### `commitWork(fiber)`

Applies the corresponding DOM mutations targeting the nearest parent ancestor
containing a physical DOM node.

- **`PLACEMENT`**: Appends the node via `domParent.appendChild`.
- **`UPDATE`**: Mutates attributes via `updateDom(dom... )`.
- **`DELETION`**: Safely cleans up effects and calls `removeChild`.
- **`HYDRATE`**: Silently attaches event listeners and properties to existing

  SSR-generated Server HTML without destroying it.

### Effects Pipeline

Within the commit traversal:

1. `runLayoutEffects` sweeps synchronously after DOM mutation.
2. `cancelEffects` (cleanup) happens prior to the update.
3. `runNormalEffects` runs gracefully after paint.

### `updateDom(dom, prevProps, nextProps)`

Diffs object properties dynamically:

- Mutates inline CSS styles mapping CamelCase to Kebab-Case.
- Wraps Events (`onClick` -> `click`) internally inside `dom._ryunixHandlers` to

  permit reliable garbage collection and targeted `removeEventListener` calls.

- Injects a security filter `validateUri()` against standard dangerous protocols

  (`javascript:`, `data:`, `vbscript:`) targeting properties like `href`.
