# Ryunix Webpack Loaders

Ryunix heavily leverages Webpack AST parsing and string manipulation loaders to blur the lines between Server and Client constraints seamlessly.

## Ryunix Server Components (RSC) Loader

The `ryunix-rsc-loader.mjs` is injected into the Webpack module pipeline to natively support Island Architecture without explicit developer scaffolding.

### How it Works
1. Scans every incoming file for directives (`// @server`, `// @client`) or implicit Ryunix patterns (such as importing/using `useStore`, `useEffect`, etc.).
2. If it determines a file is a **Client Component**:
   - It hashes the absolute file path (e.g., `md5`).
   - Appends an IIFE (Immediately Invoked Function Expression) to the bottom of the transpiled module.
   - The IIFE tags the exported function with `ryunix_client_id = "hash"`.
   - On the browser, it seamlessly injects the component reference into the global `window.__RYUNIX_ISLANDS__["hash"]` dictionary.

### Result
When the Ryunix Core Reconciler processes SSR hydration (`init()` -> `hydrateIslands()`), it reads the `data-ryunix-island="hash"` attributes emitted by the server, looks up the function in the `__RYUNIX_ISLANDS__` global dictionary, and interactively mounts that isolated fragment of the DOM, shipping highly optimized and completely separated Client JS blocks.

## Server Actions Loader

To execute server-side Node.js functions triggered directly from Client component actions, Ryunix uses the custom `ryunix-server-action-loader.mjs`.

See the dedicated [Server Actions Documentation](./server-actions.md) for a deep dive into how Babel AST transforms synchronous client-side invocations into `POST /_ryunix/action` payload fetches.
