# Ryunix Server Actions

Server Actions are asynchronous functions defined in module files that seamlessly bridge the gap between frontend components and backend execution. By annotating a file with the `// @server` directive, developers can export functions that are automatically callable from the client but executed on the Node.js server.

## How It Works

The magic is handled by `ryunix-server-action-loader.mjs`, a custom Webpack loader built using Babel.

### Loader Transformation

When Webpack processes a file starting with `// @server`:

#### On the Client (`target: web`)
1. The loader parses the AST to find all exported asynchronous functions.
2. It strips the actual implementation.
3. It replaces the export with an automatically generated proxy imported from `@unsetsoft/ryunixjs`:
   ```javascript
   import { createActionProxy as __ryunixCreateActionProxy } from '@unsetsoft/ryunixjs';
   export const myAction = __ryunixCreateActionProxy("HASHED_ACTION_ID");
   ```
4. When `myAction()` is called on the client, the proxy performs a `POST /_ryunix/action` request containing the `actionId` and arguments.

#### On the Server (`target: node`)
1. The loader parses the AST to find the exact same exported functions.
2. It appends registration logic to the bottom of the file to store the function inside a global dictionary (`globalThis.__RYUNIX_SERVER_ACTIONS__`).
3. The keys matched during registration perfectly align with the `HASHED_ACTION_ID` generated for the client.

### Dev & Prod Execution

When the `POST /_ryunix/action` endpoint is hit, the server intercepts the request, looks up the function in the `__RYUNIX_SERVER_ACTIONS__` registry, invokes it with the deserialized arguments, and sends the JSON result back to the frontend component.
