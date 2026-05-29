# RyunixJS Server Features & Architecture Bridging

Ryunix goes beyond Client-Side Rendering exclusively by natively integrating
patterns for Server-Side capabilities. This document uncovers the mechanics of
Server Actions and internal bridging.

---

## Table of contents

- [RyunixJS Server Features & Architecture Bridging](#ryunixjs-server-features--architecture-bridging)
  - [Table of contents](#table-of-contents)
  - [1. Server Actions (`serverActions.js`)](#1-server-actions-serveractionsjs)
  - [2. Server Boundary (`serverBoundary.js`)](#2-server-boundary-serverboundaryjs)
  - [3. The Dependency Bridge (`bridge.js`)](#3-the-dependency-bridge-bridgejs)

---

## 1. Server Actions (`serverActions.js`)

Ryunix allows functions executed on the server to be seamlessly triggered from
the client browser without manually writing HTTP `fetch` wrappers.

This relies fundamentally on compilation transforms (e.g.,
`ryunix-server-action-loader.mjs`) which physically strips the server-side logic
payload from the bundle and replaces it with a client proxy.

### `createActionProxy(actionId)`

When the compiler replaces a `use server` function in the client bundle, it
injects `createActionProxy("unique-action-id")`. Upon execution in the browser:

1. Arguments are strictly `JSON.stringify` serialized.
2. An asynchronous HTTP `POST` request is fired to the configured

   `/_ryunix/action` endpoint.

3. The request uniquely includes `X-Ryunix-Action` headers to enforce CSRF

   security boundaries actively.

4. If successful, the JSON resolves recursively into the component logic.

---

## 2. Server Boundary (`serverBoundary.js`)

When building Server Components architectures, sections of the Virtual DOM are
rendered strictly on the Node.js server. When the client boots up, it attempts
to "hydrate" the HTML—meaning it evaluates its own Virtual DOM and matches it to
the DOM. If the client doesn't know about the server-only components, it would
destructively delete them.

### `ServerBoundary` Component

Ryunix injects `<ServerBoundary id="...">` as a protective wrapper around
server-only content strings.

- On the client, this component evaluates extremely lazily, returning a simple

  `<div data-ryunix-server="id" style="display: contents">`.

- During hydration, the reconciler (`fiber-update.js`) **skips reconciling
  children** under this node and advances the hydration cursor past the
  preserved server markup.

- `ServerBoundary` is **not** a hydration recovery target (unlike
  `HydrationBoundary`).

---

## 3. The Dependency Bridge (`bridge.js`)

Due to the strictly modular decoupling of Ryunix's internal state machine,
`hooks.js` and `workers.js` technically depend on one another.

- `hooks.js` requires `scheduleWork` from `workers.js` to dispatch state

  updates.

- `workers.js` needs to iterate Hook indexes aggressively.

### Circular Dependency Break

`bridge.js` acts as an intermediary memory pointer:

1. `hooks.js` imports `scheduleWork` from the Bridge statically.
2. During initialization, `workers.js` executes `setScheduleWork(scheduleWork)`

   physically binding its internal Work Loop function reference inside the
   Bridge closure memory.

3. This completely eliminates JavaScript cyclical import restrictions while

   maintaining strict type safety across the engine boundaries.
