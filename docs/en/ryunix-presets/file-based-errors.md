# Ryunix Presets: File-Based Error Interception

Ryunix drastically simplifies global Application failures by unifying compiler compilation drops and React-like Virtual DOM panics straight into the same developer overlay exclusively via declarative convention logic.

---

## 1. App Router Error Catching (`error.ryx`)

During the automated directory traversal scanning inside the `.ryunix/server/app/app-router.js` transpilation cycle, Ryunix intrinsically looks for isolated `error.ryx` nodes universally.

`AppRouterPlugin.mjs` identifies specific export bindings (e.g. `export default function Error()`) directly injecting it globally across the nearest `isServerComponent` topology segment.

1. **AST Wrappers**: `<Ryunix.ErrorBoundary fallback={e.default}>{result}</Ryunix.ErrorBoundary>` 
2. **Propagated Segments**: This natively guarantees that throwing an exception specifically inside `src/app/dashboard/profile.ryx` only crashes the specific `<Profile />` segment falling back dynamically to `src/app/dashboard/error.ryx` without catastrophically obliterating the sibling `<Sidebar />` boundaries.
3. **Global Fallbacks**: If no localized boundaries exist, it escalates recursively explicitly up the tree until intercepted heavily by the primary `RyunixDevOverlay` during Development explicitly rendering the React-like Stack Traces cleanly.

---

## 2. Global Development Injection (`webpack.config.mjs`)

Ryunix completely overrides string-based generic Webpack WebSockets injecting its own strongly typed dual-compiler extraction overlays physically interacting over WS.

### Dual-Compiler Consolidation Structure
Because `@unsetsoft/ryunixjs` maintains explicit Dual-Compiling pipelines representing Client-Builds natively parallel to SSR Node Server executions:
- **Deduplication Pipelines**: Standard Webpack emits Duplicate identical Module Resolution Errors redundantly (Client complaining `missing file`, Server complaining `missing file`).
- Ryunix injects a custom `buildOverlayScript` deeply inside `HtmlWebpackPlugin`.
- Using internal `Set()` architectures, parsed stack traces strings are cross-referenced across compilation events implicitly hiding duplicate server/client overlaps outputting a unified physical error exclusively.
- **Auto Recovery Resets**: Inside `errorOverlay.dismiss()`, upon repairing the raw Javascript file cleanly hooking an active `window.location.reload()` forcing HMR to definitively wipe out overlapping visual DOM diff mismatches entirely.
