# Ryunix Presets: Routing & SSG Architecture

Ryunix heavily abstracts the routing implementation via Webpack Compiler
plugins. Developers do not write manual `<Route path="/">` structures; the file
system is universally transcribed into Virtual DOM AST strings during the
compile loop automatically.

---

## Table of contents

- [Ryunix Presets: Routing & SSG Architecture](#ryunix-presets-routing--ssg-architecture)
  - [Table of contents](#table-of-contents)
  - [1. The App Router Framework (`appRouterPlugin.mjs`)](#1-the-app-router-framework-approuterpluginmjs)
  - [2. Legacy SSG Manifests (`ssgPlugin.mjs`)](#2-legacy-ssg-manifests-ssgpluginmjs)
  - [3. SSR Development Ecosystem (`ssrDevHandler.mjs`)](#3-ssr-development-ecosystem-ssrdevhandlermjs)

---

## 1. The App Router Framework (`appRouterPlugin.mjs`)

This plugin intercepts Webpack's `beforeCompile` hook dynamically scanning the
`src/app` directory sequentially.

### Role & Capabilities

- **Regex Heuristics**: As it locates `.ryx` or `.js` Component files, it

  actively runs string patterns across the source blobs (e.g.,
  `export async default function`, `useStore()`). This automatically determines
  `isServer: true/false` universally without the user declaring strict literal
  `.client.ryx` boundaries physically.

- **Topological Mapping**: Assembles a logical JavaScript object containing the

  nested `layout`, `index`, `error`, and `loading` component paths mapping
  exactly exactly to folder names parameters like `[slug]`.

- **String Templating**: The engine natively serializes the Object tree back

  into raw JavaScript Strings. It automatically wires up the
  `<Ryunix.Suspense>`, `<ServerBoundary>`, and `<Ryunix.ErrorBoundary>` wrappers
  statically outputting the final bundle logic identically to
  `.ryunix/server/app/app-router.js` executing native transpilation implicitly.

- **Dependency Injections**: Integrates heavily with Webpack's

  `compilation.contextDependencies`. If a route is added/deleted during
  execution, Webpack intrinsically invalidates the `devServer` cache forcing the
  `AppRouterPlugin` to rescan silently maintaining HMR reliability.

---

## 2. Legacy SSG Manifests (`ssgPlugin.mjs`)

Historically recognized as `RyunixRoutesPlugin`, this plugin orchestrates legacy
routes bound strictly by the `routes.ryx` array definition targeting `.mdx`
Static Site Generation builds.

### Custom AST Parsing Engine

The plugin heavily prioritizes speed over dependency safety. Instead of
downloading heavy Babel AST transformers (e.g., `esprima`), it parses JS literal
array structures exclusively using robust internal Regex state machines and
Brace tracking algorithms (`{` counting variables).

1. **Frontmatter Interception**: Greps the entire blob for Markdown Imports

   (`import X, { frontmatter as Y } from "path.mdx"`). It reads the target MDX
   file immediately from the physical disk, stripping the YAML lines, and
   storing them seamlessly inside an active Map dictionary.

2. **Template Variables Extraction**: As the string loops extract route

   definitions (`path: \'/docs/${variable.label}\'`), it intrinsically evaluates
   standard JavaScript template expressions safely resolving the exact target
   URL mapping natively parsing array values and boolean flags.

3. **SSG Checklisting**: Finalizes by ejecting a pure JSON document

   (`routes.json`) inside `.ryunix/ssg/` completely enabling the `bin/index.mjs`
   SSG crawler to recursively render every valid `/docs/x` string to `.html`
   physical volumes seamlessly without executing actual headless browsers
   contexts.

### Prerendering Engine

- Loads the `<AppRouter />` server bundle directly into the Node process

  utilizing the core API `renderToReadableStream()`.

- Automatically generates and injects `<meta>`, `<link rel="canonical">`, and

  `<title>` tags into the raw `index.html` template.

- Saves the hard-coded HTML output into folders mapping directly to their URL

  route natively.

---

## 3. SSR Development Ecosystem (`ssrDevHandler.mjs`)

To ensure the Developer Experience (DX) matches production semantics natively,
the Webpack `devServer` intercepts requests identically:

- Intercepts explicit `GET` requests for `text/html`.
- Mocks global objects (`window.location`, `document`) safely across Node.
- Executes `renderToReadableStream` on the backend natively, injecting the

  static HTML structure and development CSS tags directly into the response
  buffer.

- Eliminates First Paint Blank Screens implicitly.
