# Ryunix CLI and Server Architecture

The Ryunix preset (`@unsetsoft/ryunix-presets`) ships with a robust command-line interface (CLI) and two dedicated server modes for development and production.

## The CLI (`bin/index.mjs`)

The CLI is built using `yargs` and provides the core commands to manage a Ryunix application:

- **`dev`**: Starts the Webpack Dev Server. It dynamically finds an available port (default 3000), clears the `.ryunix/cache`, and launches Hot Module Replacement (HMR).
- **`build`**: Executes the Dual Compiler (Client and Server targets). It cleans previous build artifacts (except the cache to maintain speed), outputs the `/static` client bundle and the `/server` Node.js bundle, and if `production: true` is set, triggers SSG Prerendering.
- **`start`**: Launches the native Node.js production server. Requires a pre-existing `.ryunix/static` build.
- **`lint`**: Runs ESLint against the configured files using the internal Ryunix ESLint config.
- **`customHtml`**: Extracts the default `index.html` template into the user's `/public` folder to allow manual overrides of the document shell. (deprecated)

## Production Server (`bin/prod.server.mjs`)

The production server is a highly optimized, native `http` Node.js server designed for performance without relying on heavy frameworks like Express.

### Features
- **In-Memory Caching:** Implements a `50MB` LRU-style cache (`fileCache`) for static assets to avoid repetitive disk I/O.
- **Dynamic Compression:** Automatically detects the `Accept-Encoding` header and compresses text-based assets using `brotli` (quality 6) or `gzip` on the fly, storing the compressed buffers in the cache alongside the raw content.
- **Streamed Media & Ranges:** Fully supports HTTP `206 Partial Content` and `Range` headers out of the box. Essential for natively streaming `<video>` and `<audio>` tags directly from the server.
- **ETag Validation:** Generates MD5 hashes of file contents to yield `304 Not Modified` responses for aggressive browser caching.
- **API Routing:** Pipes `/api/*` requests directly through the `handleApiRequest` utility before attempting to serve static files.
- **SPA Fallback:** If a requested route isn't natively found as an `.html` file, it securely falls back to serving the cached `index.html` to allow the Client-Side Router to take over.

## Development Server (`bin/dev.server.mjs`)

Wraps `webpack-dev-server`.
- Orchestrates the `clientConfig` to inject HMR runtimes.
- Uses `checkPortInUse` via native `net.createServer` to gracefully increment the port (3000 -> 3001) if another process is occupying the default.
- Sets the environment correctly to ensure the `Profiler` and `DevTools` warnings are active.
