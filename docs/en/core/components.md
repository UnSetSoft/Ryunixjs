# Built-in Ryunix Components

Ryunix ships with several native components that hook directly into the architecture's reconciler phases.

## Component Boundary Handling

### `<ErrorBoundary />`
A native Ryunix component that catches JavaScript errors thrown anywhere in its child component tree.
- It operates inside the `performUnitOfWork` loop (`workers.js`).
- If an Unhandled Exception is caught during render, the reconciler climbs up the `fiber.parent` chain searching for `RYUNIX_ERROR_BOUNDARY`.
- It dynamically prunes the corrupted children, sets the `stateError` inside the fiber, and rewinds the `wipFiber` pointer so the loop safely recovers and displays the `fallback` prop.

### `<ServerBoundary />`
Used to exclusively shield content that was rendered on the server during Partial Hydration.
- Used extensively with Island Architecture (`hydrateIslands()`).
- The children inside a Server Boundary are ignored by the client-side app, preventing hydration mismatches on inherently server-dependent nodes (such as dynamic markdown or database lists that don't need interactivity).

## Asynchronous Loading

### `lazy(importFn)`
Creates a `LazyComponent` acting as a wrapper for dynamic code splitting (`import()`). 
- Features three internal states: `PENDING`, `RESOLVED`, `REJECTED`.
- It triggers a synchronous `forceUpdate` when the module chunk finishes downloading across the network.

### `<Suspense />`
Pairs perfectly with `lazy()`. It detects whether any child element inside its tree is still internally `PENDING`.
- If so, it immediately renders the `fallback` skeleton UI.
- Very powerful when paired with Server-Side-Rendering (`renderToReadableStream`). It delegates lazy loading to a background Promise and streams the fallback immediately; substituting it via `<template>` replacement when the server task finishes.

### `preload(importFn)`
Utility function that immediately invokes the chunk fetch. Can be triggered on hover events via `Link` headers before a user clicks.

## Advanced Scopes

### `<MDXContent />` & `<MDXProvider />`
Native support for MDX compilation.
- Injects a context containing `defaultComponents` map that automatically aliases standard HTML tags (`<h1>`, `<p>`, etc.) directly to Ryunix `createElement` host nodes.
- Exposes `getMDXComponents()` to allow runtime overloads of headers or syntax highlighting components.

### `createPortal(children, container)`
Symbol marked as `RYUNIX_PORTAL`. Instructs the Commit phase (`commitWork()`) to abandon the standard parent-child logical appendage and directly map the constructed `children` DOM nodes into a secondary `portalContainer` located anywhere on the page (excellent for top-level z-index modals and tooltips).
