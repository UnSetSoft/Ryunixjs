# Ryunix Presets: CLI & Bootstrapping Architecture

The `@unsetsoft/ryunix-presets` package delivers a highly opinionated CLI engine
that completely abstracts away standard Webpack boilerplate wiring.

It is physically mapped to the generic `ryunix` bash command via the
`package.json` `"bin"` directory export.

---

## Table of contents

- [Ryunix Presets: CLI & Bootstrapping Architecture](#ryunix-presets-cli--bootstrapping-architecture)
  - [Table of contents](#table-of-contents)
  - [1. Top-Level CLI Routing (`bin/index.mjs`)](#1-top-level-cli-routing-binindexmjs)
  - [2. Development Engine (`bin/dev.server.mjs`)](#2-development-engine-bindevservermjs)
  - [3. Native Production Web Server (`bin/prod.server.mjs`)](#3-native-production-web-server-binprodservermjs)

---

## 1. Top-Level CLI Routing (`bin/index.mjs`)

Ryunix utilizes `yargs` to parse command-line arguments securely. It exposes
five native execution commands:

1. **`lint`**: Invokes a custom instance of ESLint overriding the developer's

   raw configuration with the strongly opinionated default `eslintConfig`
   shipped inside `ryunix-presets`.

2. **`dev`**: Mutates the active environment variable

   `process.env.RYUNIX_MODE = 'development'` and defers execution to
   `dev.server.mjs`.

3. **`start`**: Mutates `process.env.RYUNIX_MODE = 'production'` and directly

   provisions the internal node application `prod.server.mjs`. Validates the
   `build/static` directory to guarantee a compiled target exists.

4. **`build`**: Aggressively obliterates stale `.ryunix/static` and

   `.ryunix/server` build artifacts ensuring a fully reproducible clean state.
   Triggers the Webpack compilation event. Upon success, executes an additional
   SSG `Prerender` mapping function concurrently.

5. **`customHtml`**: Extracts the framework's internal baseline `index.html`

   structure directly into the user's `public/` directory, exposing explicit
   customization pipelines.

---

## 2. Development Engine (`bin/dev.server.mjs`)

When developers invoke `npx ryunix dev`, this runtime spins up the hot-reloading
architecture.

- **Automated Directory Cleanups**: Dynamically clears out stale Webpack `cache`

  partitions.

- **Strict Array Matching**: Since RyunixJS runs a Dual-Compiler architecture

  (generating Client-bundles and Server-bundles concurrently), the
  `dev.server.mjs` script smartly scans the exported arrays in
  `webpack.config.mjs`, extracts the configuration strictly tagged with
  `name === 'client'`, and bridges it exclusively to the `WebpackDevServer()`.

- **Intelligent Port Binding**: Interrogates the operating system explicitly

  using native Node.js TCP networking (`net.createServer`) probing sequentially
  for available port openings instead of crashing ungracefully when
  `localhost:3000` is stubbornly locked by another Node application.

---

## 3. Native Production Web Server (`bin/prod.server.mjs`)

Unlike traditional frameworks dictating external dependency binaries (e.g.
`serve`) to preview builds, Ryunix ships a fiercely optimized `<http>`
production runtime server natively out of the box explicitly tailored for its
specific folder topology.

- **Dynamic Range Buffering**: Natively intercepts HTTP `Range: bytes=` chunk

  requests intelligently pipelining heavy static streams (like `.mp4` video
  blobs or `.pdf` volumes) progressively instead of memory starving the server
  runtime trying to serialize gigabytes identically.

- **Caching Layer**: Bootstraps an embedded LRU configuration

  (`fileCache: Map`). It strictly holds up to `50MB` (`MAX_CACHE_SIZE`) of
  heavily accessed compiled text files seamlessly inside the physical RAM
  allocations avoiding blocking `fs.readFile` I/O operations constantly.

- **On The Fly Compression Engines**: It aggressively evaluates the client

  request HTTP `Accept-Encoding` specification. If the file is textual (HTML,
  JS, CSS, JSON), it spins up built-in Node `zlib` capabilities to statically
  transpile arrays caching both the `.gzipped` and heavily reduced
  `.brotliCompress` (`br`) format pipelines statically side-by-side in memory
  forever.

- **API Request Interception**: Inspects `req.url`. If a targeted request

  matches the static `/_ryunix/action` payload signature or explicitly targets
  an isolated file inside the `server/api` compile directory, it abandons the
  static file distribution loops natively traversing instead strictly to the
  `.mjs` server-side endpoints executing safely bypassing the standard Single
  Page Application layout fallback loop implicitly.
