# Ryunix Presets: API Routing Infrastructure

The Ryunix API layer is not driven by the core Webpack compiler. Instead, it
utilizes an isolated out-of-band compilation system maximizing performance
specifically for backend contexts.

---

## Table of contents

- [Ryunix Presets: API Routing Infrastructure](#ryunix-presets-api-routing-infrastructure)
  - [Table of contents](#table-of-contents)
  - [1. Out-of-Band Compilation (`ApiRouterPlugin.mjs`)](#1-out-of-band-compilation-apirouterpluginmjs)
  - [2. Request Handling Pipeline (`apiHandler.mjs`)](#2-request-handling-pipeline-apihandlermjs)

---

## 1. Out-of-Band Compilation (`ApiRouterPlugin.mjs`)

Because API routes do not require complex CSS loaders or CSS parsing strings,
sending them through the massive Webpack loaders is wasteful.

1. **Direct SWC Transforms**: Ryunix imports `@swc/core` natively. It watches

   entirely over `src/app/api/**/*.js`, `.ts`, and `.ryx`.

2. **ESM Targetting**: Files are passed directly through the Rust-based SWC

   `transformSync(content)` engine explicitly generating Node.js native ES2022
   ES6 module configurations.

3. **File Output**: The AST structures are written aggressively directly to

   `.ryunix/server/api/` completely independent of the heavy
   `app-router-server.js` bundles resolving Webpack pipelines entirely.

---

## 2. Request Handling Pipeline (`apiHandler.mjs`)

On every single HTTP request hitting `/api/`, the production Web Server
(`prod.server.mjs`) delegates routing string matches internally inside the node
environment.

### Dynamic Resolution (`matchRoute`)

It dynamically mirrors Next.js-like topological path structures strictly without
massive dependencies:

- Intercepts requests like `GET /api/users/123`.
- Natively traverses directories executing nested Folder structure mapping loops

  identifying specific structures like `[id]` extracting the variable
  aggressively into `req.params`.

- Detects the `[...slug]` "catch-all" configurations extracting nested deeply

  looped params identically explicitly mapping them statically.

### Execution & Hot Reloading

Once the endpoint path is strictly locked, Ryunix leverages standard REST
bindings:

1. **ESM Loading**: Ryunix dynamically imports the compiled target module

   natively utilizing Node.js `await import(importUrl)`.

2. **Hack Hot-Reloading**: To overcome Node's strict ESM Cache invalidation

   limitations specifically during Development mode, Ryunix dynamically appends
   `?update=${Date.now()}` physically to the module loader string. This forcibly
   forces Node to re-download the API file physically without dropping the
   server runtime.

3. **Execution**: Matches `req.method.toUpperCase()` locally against the

   exported dictionary bindings inside the API endpoint
   (`export const GET = () => {}`). Handshake complete.
