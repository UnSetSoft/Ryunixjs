# RyunixJS Rendering Architecture

RyunixJS provides a unified rendering system capable of executing identically on both the Browser (Client-Side Rendering) and Node.js/Edge environments (Server-Side Rendering).

This document details the exact mechanisms and entry points responsible for converting Ryunix Elements into physical pixels or raw HTML strings.

---

## 1. Client-Side Rendering (`render.js`)

The entry points for the browser environment handle initializing the application Root.

### `init(MainElement, rootId)`
The intelligent bootstrap function. `init` automatically detects whether the target DOM container has existing Server-Rendered children. 
- **SSR Detected**: It gracefully transitions to `hydrate()` to attach event listeners without destroying the existing markup.
- **Empty Container**: It falls back to standard `render()`.
- *Note*: Developers can force a full client-render bypassing hydration by passing `process.env.RYUNIX_SSR = 'false'`.

### `render(element, container)`
Performs a destructive Client-Side Render (CSR).
1. Calls `clearContainer(container)` to obliterate any existing inner HTML.
2. Initializes a synthetic `wipRoot` Fiber mapped to the physical `container` DOM node.
3. Invokes `scheduleWork(root)` to ignite the `workers.js` concurrent loop.

### `hydrate(element, container)`
Attaches the RyunixJS engine to pre-compiled HTML sent from the server.
1. Leaves the existing DOM Nodes completely intact.
2. Computes the logical `nextValidSibling` traversing past text carriage returns or HTML comments.
3. Sets `state.isHydrating = true` and `state.hydrateCursor` to track position.
4. Initializes `scheduleWork(root)`.
5. **Fallback Safety**: If Hydration fails (Mismatched UI), Ryunix's commit phase (`commits.js`) detects the desync (`state.hydrationFailed`), obliterates the container, and forces a native CSR `PLACEMENT` to ensure the application remains strictly usable.

---

## 2. Server-Side Rendering (`server.js`)

The Server parser works completely synchronously (or asynchronously with Streams), aggressively short-circuiting Hooks logic via globals (`state.isServerRendering = true`) to prevent memory leaks in stateful hooks across varying Node.js threads.

### `renderToString(element)`
Used for generic Static Site Generation (SSG).
Recursively parses the Virtual DOM tree, evaluating component Functions and mapping properties to HTML string blobs.
- Converts `className` to `class` natively.
- Evaluates standard HTML5 Void empty tags `<img />` correctly.
- Safely strips dangerous URI protocols via `validateUri` (e.g., `javascript:` links).

### `renderToReadableStream(element)`
The flagship streaming implementation featuring automatic `<RYUNIX_SUSPENSE>` unlocking.
Returns a native `ReadableStream` allowing HTTP servers to stream headers and chunks instantly before the CPU finishes evaluating the complete document.

#### Async Suspense Streaming internally:
1. Pushes the `<template id="B:uuid">` and fallbacks down the HTTP pipe instantly.
2. Initiates background asynchronous evaluated tasks (`suspenseTasks`) for lazy routes fetching data.
3. When the async component finishes, Ryunix pushes the completed HTML enclosed in a `<template>` along with a tiny inline Javascript evaluator script (`$RC("S:uuid", "P:uuid")`).
4. The client's browser parses the script and securely replaces the fallback loader with the retrieved content progressively.
