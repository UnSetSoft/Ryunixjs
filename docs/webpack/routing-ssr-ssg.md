# Routing, SSR, and SSG in Ryunix

The Webpack preset utilizes powerful custom plugins that scan the file system at compilation time to generate AST-optimized routing trees.

## File-System Routing Plugins

### `AppRouterPlugin`
Scans the user's `app/` directory (or configured path) and automatically constructs a nested React-style Router configuration (`.ryunix/server/app/app-router.js`).

1. **Auto-Detection**: It parses the source code of files using Regex to detect Hooks (`useStore`, `useEffect`) or Async Exports (`export async default`) to automatically deduce if a component is a Client Component or Server Component.
2. **Boundary Generation**: Maps `layout.ryx`, `error.ryx`, `loading.ryx`, and `index.ryx` files to Ryunix Native Boundaries (`<ErrorBoundary>` and `<Suspense>`).
3. **Metadata Aggregation**: Resolves and merges exported `Metatags` objects or `generateMetadata()` async functions from parent layouts down to child indices.
4. **Isomorphic Shell**: It outputs dual configurations. On the Server Build, it directly references the components for SSR evaluation. On the Client Build, it creates proxy loaders (`AsyncComponentRenderer`) for lazy-loading chunks.

### `ApiRouterPlugin`
A minimal plugin that scans the `app/api/` folder for `route.js` or `endpoint.js` files.

## Static Site Generation (SSG)

### `RyunixRoutesPlugin` and `ssg.mjs`
Triggered conditionally during a Production Build.

#### Extraction & Evaluation
- It reads the compiled `app-router-server.bundle.mjs` and native `routes.ryx` (legacy configurations).
- It extracts frontmatter from MDX files to understand dynamic SEO properties.
- It parses templates (`/docs/\${slug}`) evaluating them against the localized cache.

#### Prerendering
- Loads the `<AppRouter />` server bundle directly into the Node process using the `Ryunix` core API `renderToReadableStream()` or `renderToString()`.
- Captures the initial HTML state.
- Automatically generates and injects `<meta>`, `<link rel="canonical">`, and `<title>` tags into the raw `index.html` template.
- Saves the hard-coded HTML output into folders mapping directly to their URL route.

#### SEO Manifests
- Uses the aggregated metadata to intelligently output an XML `sitemap.xml` and `robots.txt` honoring `changefreq`, `lastmod`, and `priority`.

## Server-Side Rendering (SSR) in Development Mode

### `ssrDevHandler.mjs`
To ensure the Developer Experience (DX) matches production semantics, DevServer intercepts requests natively:
- Intercepts `GET` requests for `text/html`.
- Requires the `clientCompiler` to access the virtualized (in-memory) `index.html`.
- Loads the generated `app-router-server.bundle.mjs` (the Server Build of the app).
- Mocks global objects (`window.location`, `document`) if necessary.
- Executes `renderToReadableStream` on the backend, injecting the static HTML structure and development CSS `<link>` tags directly into the response buffer.
- Eliminates First Paint Blank Screens, giving the impression of an instant load while Webpack processes the rest of the chunks.
