# RyunixJS Rendering Architecture

RyunixJS provides a unified rendering system capable of executing identically on
both the Browser (Client-Side Rendering) and Node.js/Edge environments
(Server-Side Rendering).

This document details the exact mechanisms and entry points responsible for
converting Ryunix Elements into physical pixels or raw HTML strings.

---

## Table of contents

- [RyunixJS Rendering Architecture](#ryunixjs-rendering-architecture)
  - [Table of contents](#table-of-contents)
  - [1. Client-Side Rendering (`render.js`)](#1-client-side-rendering-renderjs)
  - [2. Server-Side Rendering (`ssr.ts`)](#2-server-side-rendering-ssrts)

---

## 1. Client-Side Rendering (`render.js`)

The entry points for the browser environment handle initializing the application
Root.

### `init(MainElement, rootId)`

The intelligent bootstrap function. `init` automatically detects whether the
target DOM container has existing Server-Rendered children.

- **SSR Detected**: It gracefully transitions to `hydrate()` to attach event

  listeners without destroying the existing markup.

- **Empty Container**: It falls back to standard `render()`.
- _Note_: Developers can force a full client-render bypassing hydration by

  passing `process.env.RYUNIX_SSR = 'false'`.

### `render(element, container)`

Performs a destructive Client-Side Render (CSR).

1. Calls `clearContainer(container)` to obliterate any existing inner HTML.
2. Initializes a synthetic `wipRoot` Fiber mapped to the physical `container`

   DOM node.

3. Invokes `scheduleWork(root)` to ignite the `workers.js` concurrent loop.

### `hydrate(element, container)`

Attaches the RyunixJS engine to pre-compiled HTML sent from the server.

1. Leaves the existing DOM Nodes completely intact.
2. Computes the logical `nextValidSibling` traversing past text carriage returns

   or HTML comments.

3. Sets `state.isHydrating = true` and `state.hydrateCursor` to track position.
4. Initializes `scheduleWork(root)`.
5. **Fallback Safety**: If Hydration fails (Mismatched UI), Ryunix's commit

   phase (`commits.js`) detects the desync (`state.hydrationFailed`),
   obliterates the container, and forces a native CSR `PLACEMENT` to ensure the
   application remains strictly usable.

---

## 2. Server-Side Rendering (`ssr.ts`)

Implementation lives in `packages/core/src/lib/server/ssr.ts`. The server parser
runs synchronously (`renderToString`) or asynchronously via streams
(`renderToReadableStream` / `renderToStringAsync`), short-circuiting hooks with
`state.isServerRendering = true` and resetting `ssrMetadata` / `ssrContexts` at
the start of each render.

### `renderToString(element)`

Synchronous render for trees without async components or Suspense streaming.
Throws when a component returns a `Promise` (use `renderToStringAsync` instead).

### `renderToStringAsync(element)`

Convenience wrapper over `renderToReadableStream`; used by the App Router during
SSG and SSR dev.

### `renderToReadableStream(element)`

The flagship streaming implementation featuring automatic `<RYUNIX_SUSPENSE>`
unlocking. Returns a native `ReadableStream` allowing HTTP servers to stream
headers and chunks instantly before the CPU finishes evaluating the complete
document.

#### Async Suspense Streaming internally

1. Pushes the `<template id="B:uuid">` and fallbacks down the HTTP pipe

   instantly.

2. Initiates background asynchronous evaluated tasks (`suspenseTasks`) for lazy

   routes fetching data.

3. When the async component finishes, Ryunix pushes the completed HTML enclosed

   in a `<template>` along with a tiny inline Javascript evaluator script
   (`$RC("S:uuid", "P:uuid")`).

4. The client's browser parses the script and securely replaces the fallback

   loader with the retrieved content progressively.
