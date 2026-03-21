# RyunixJS Error Handling & Global DevOverlay

Ryunix heavily isolates components structurally to prevent the entire frontend DOM from collapsing upon a single Component exception.

It features two distinct layers:
1. Declarative Error Boundaries for production fallbacks.
2. Aggressive Global Diagnostic Overlays deployed automatically during `.env` Development builds.

---

## 1. Error Interception (`workers.js`)

During `performUnitOfWork(fiber)`, component rendering functions are enveloped in an explicit `try/catch` block.

If an unhandled exception triggers:
1. Ryunix inspects the crashing component's `fiber.props` to extract structural metadata (e.g. `fiber.props.__source` natively injected by SWC/Babel compiling steps) mapping strict exact line numbers (`index.ryx:80`).
2. It walks up the Parent `fiber` tree upward dynamically, exclusively hunting for a component typed strictly as `RYUNIX_ERROR_BOUNDARY`.
3. If located, Ryunix mutates the Error Boundary's internal `stateError` to harbor the exact JavaScript `Error` Object.
4. **Tree Amputation**: It drops `fiber.child = null` directly traversing the corrupted branch logic internally, forcing the Work Loop to cleanly skip the invalid rendering block and revert cleanly to evaluating the boundary's `fallback` tree prop instead.

---

## 2. Declarative Fallbacks (`errorBoundary.js`)

### `<ErrorBoundary />`
A native wrapper component providing scoped uncoupling.

```jsx
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <BuggyComponent />
</ErrorBoundary>
```

If `BuggyComponent` explodes, the `ErrorBoundary` will silently swallow the exception and render the declarative `<div />`. In production environments, this ensures applications gracefully fallback sections without exposing ugly stack traces or rendering black blank screens.

---

## 3. Global Developer Overlay (`devOverlay.js`)

In non-production environments, developers need immediate, aggressive feedback detailing what failed, where, and why without opening a browser DevTools console.

Ryunix implements the `RyunixDevOverlay`, an un-subscribable graphical modal instantiated universally around the root application tree (automatically injected by the internal Webpack `AppRouterPlugin` ecosystem if `error.ryx` is missing).

### Functional Architecture
- When `errorBoundary.js` traps a crash in a non-production build, instead of just displaying your custom CSS-less fallback string, it spawns `<RyunixDevOverlay />`.
- **Intelligent Stack Tracing**: `RyunixDevOverlay` runs Regex matchers against browser-specific error stack layouts (V8 Chrome, SpiderMonkey Firefox). It explicitly filters out internal framework noise routines (`packages/core/src/lib/workers.js`) so the developer only inspects tracing matching their own application code paths.
- **Physical Source Locating**: Taking advantage of the precise `error.__ryunix_source` mapped backward by `workers.js` during the crash cycle, `RyunixDevOverlay` issues a dynamic `fetch()` directly targeting the Webpack Development API (`/_ryunix/source?file=index.ryx&line=80`) retrieving explicit exact physical source-code file snippets highlighted vividly on the screen.
- **Resilient Rendering**: The GUI implements strict generic inline `<div style={{...}}>` objects to rigidly prevent the overlay interface from snapping or breaking if standard Application stylesheets (e.g., PostCSS, Tailwind) are currently failing or malfunctioning.
