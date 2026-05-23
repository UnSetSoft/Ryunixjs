# RyunixJS State & Priority Queue Architecture

Ryunix features a customized priority-based batching engine that controls
exactly _when_ the virtual DOM re-evaluates specific components.

By organizing updates asynchronously, Ryunix guarantees that high-priority user
interactions (typing, clicking) interrupt and suspend low-priority work (data
fetching, background syncs).

---

## Table of contents

- [RyunixJS State & Priority Queue Architecture](#ryunixjs-state--priority-queue-architecture)
  - [Table of contents](#table-of-contents)
  - [1. Batching (`batching.js`)](#1-batching-batchingjs)
  - [2. Priority Scheduling (`priority.js`)](#2-priority-scheduling-priorityjs)

---

## 1. Batching (`batching.js`)

State updates in Ryunix are batched by default to drastically reduce unnecessary
render cycles.

### The Problem

If a component invokes `setState(1)`, `setState(2)`, and `setState(3)`
consecutively within a synchronous block, a naive framework triggers 3 complete
Fiber tree traversals.

### The Solution: `queueUpdate(update)`

When `dispatch` is called internally by `useStore` or `useReducer`, it does not
directly kick off the Work Loop. Instead, it inserts the work scheduling closure
into `pendingUpdates.push(update)`.

### `batchUpdates(callback)`

When Ryunix executes Synthetic Events (e.g. `onClick`), it automatically
envelops the handler inside `batchUpdates`.

1. Flags `isBatching = true`.
2. Evaluates the handler logic. Any subsequent renders are intercepted and

   strictly queued.

3. Once the synchronous execution finishes, it safely unsets the flag and

   executes `flushUpdates()` traversing the queue as a single consolidated
   commit.

---

## 2. Priority Scheduling (`priority.js`)

Not all state updates carry the same urgency.

### Priority Levels

1. **`IMMEDIATE`**: Direct user input that strictly dictates physical

   interactivity (Keys pressed, mouse tracking).

2. **`USER_BLOCKING`**: Responsive actions where a user expects instant visual

   feedback but the browser won't crash if heavily delayed (Scrolling, Hover
   animations).

3. **`NORMAL`**: The default fallback. Standard data fetches, route navigations.
4. **`LOW`**: Background state derivations or analytical tracking processes.
5. **`IDLE`**: Actions safely pushed off to completely idle browser cycles.

### `scheduleUpdate(callback, priority)`

Pushes an update wrapper containing a numeric `priority` flag into
`pendingUpdates`.

### `processPendingUpdates(deadline)`

Ryunix utilizes `requestIdleCallback(processPendingUpdates)` (rIC). When the
browser signals that it holds an idle CPU frame, Ryunix executes:

1. `pendingUpdates.sort((a, b) => a.priority - b.priority)`: The arrays are

   re-ordered dynamically so `IMMEDIATE` and `USER_BLOCKING` jobs jump to the
   very front of the queue.

2. The loop consumes updates exactly in priority sequence, terminating

   aggressively if `deadline.timeRemaining()` indicates the 16ms framing window
   is exhausted to avoid dropping visual frames.

### `useTransition` and `useDeferredValue`

These hooks expose the internal priority scheduler to developers. Calling state
updates wrapped inside a transition explicitly downgrades their execution flag
to `Priority.LOW`. This enforces that subsequent rapid typing inputs
(`Priority.IMMEDIATE`) repeatedly preempt and cancel the background rendering of
heavy lists.
