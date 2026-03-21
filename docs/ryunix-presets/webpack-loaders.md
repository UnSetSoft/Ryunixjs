# Ryunix Presets: Webpack Loaders Architecture

Ryunix heavily leverages Webpack AST parsing and string manipulation loaders to blur the lines between Server and Client constraints seamlessly inherently.

---

## 1. Ryunix Server Components (RSC) Loader (`ryunix-rsc-loader.mjs`)

This loader is injected into the Webpack module pipeline to natively support Island Architecture without explicit developer scaffolding.

### How it Works
1. Scans every incoming file for directives (`// @server`, `// @client`) or implicit Ryunix patterns natively.
2. If it determines a file is a **Client Component**:
   - It hashes the absolute file path physically (e.g., `md5`).
   - Appends an IIFE (Immediately Invoked Function Expression) to the bottom of the transpiled module.
   - The IIFE tags the exported function globally with `ryunix_client_id = "hash"`.
   - On the browser, it seamlessly injects the component reference into the global `window.__RYUNIX_ISLANDS__["hash"]` dictionary inherently.

### Result
When the Ryunix Core Reconciler processes SSR hydration natively, it reads the `data-ryunix-island="hash"` attributes emitted by the server, statically mounting that isolated fragment eliminating heavy JS evaluation on non-interactive pages completely.

---

## 2. Server Actions Loader (`ryunix-server-action-loader.mjs`)

Server Actions are asynchronous functions that seamlessly bridge the gap between frontend components and backend execution natively via the `// @server` directive.

### Client Transformation (`target: web`)
1. The loader parses the AST to find all exported asynchronous functions specifically inside target segments.
2. It completely strips the actual implementation securely ensuring no backend secrets leak into the frontend bundle.
3. It replaces the export with an automatically generated proxy imported natively from `@unsetsoft/ryunixjs`.
4. When invoked on the client, the proxy natively performs a `POST /_ryunix/action` request containing the `actionId` and serialized arguments entirely transparent to the developer.

### Server Registration (`target: node`)
1. Parses the identical AST inherently identifying the exact exported functions natively.
2. Appends registration logic securely to store the function inside a global dictionary (`globalThis.__RYUNIX_SERVER_ACTIONS__`).
3. During Native production runtime, `prod.server.mjs` natively intercepts the `POST` payload, executes the localized function, and formally sends the JSON result natively back completely bypassing generic REST controllers.
