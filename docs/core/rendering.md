# Ryunix Core Rendering Architecture

The `@unsetsoft/ryunixjs` core rendering engine provides a modern, concurrent rendering model with robust support for Server-Side Rendering (SSR) and Island Architecture.

## Client-Side Rendering (CSR)

### `render(element, container)`
The entry point for rendering a Ryunix virtual DOM tree into a physical DOM container.
- It clears the container before rendering to prevent duplication.
- It sets up a `wipRoot` (Work-In-Progress Root) and schedules work using `scheduleWork()`.

### `hydrate(element, container)`
Used to attach Ryunix event listeners and state to an existing server-rendered HTML tree.
- Instead of clearing the tree like `render()`, it walks the existing DOM nodes (using `hydrateCursor`).
- It preserves the SSR HTML, providing a much faster initial load and seamless transition to interactive state.

### `init(MainElement, root, components)`
The smart initialization function. It automatically detects whether the target root container has child nodes.
- If child nodes exist and `process.env.RYUNIX_SSR` is truthy, it triggers `hydrate()`.
- If no child nodes exist, it triggers standard `render()`.
- It also calls `hydrateIslands()` to initialize any isolated interactive components.

## Island Architecture

Ryunix supports Partial Hydration via "Islands". This means that mostly-static pages can ship minimal JavaScript by only hydrating specific dynamic components.

### `hydrateIslands(components, hasMainElement)`
Scans the DOM for elements with the `data-ryunix-island` attribute.
- It looks up the component in the local `components` dictionary or the global `window.__RYUNIX_ISLANDS__` registry.
- It extracts the encoded properties from the `data-props` attribute.
- It calls `hydrate()` on that specific isolated container.
- Note: It avoids hydrating islands that are shielded by a `ServerBoundary` if a main element is already managing hydration.

## Server-Side Rendering (SSR)

### `renderToString(element)`
Synchronously renders a Ryunix virtual DOM tree to a string of HTML.
- Injects necessary styles and attributes.
- Escapes specific HTML characters to prevent XSS.

### `renderToReadableStream(element)`
Asynchronously renders a Ryunix tree to a Web stream (`ReadableStream`).
- Excellent for out-of-order streaming and early flushes.
- Handles `Suspense` natively by buffering background completion tasks and streaming fallback skeleton HTML immediately. Once the background tasks complete, it streams `<template>` tags with a small JavaScript helper (`$RC`) to swap the content into the DOM automatically.
