# RyunixJS Advanced Components

Beyond standard DOM elements and functional stateful components, Ryunix provides highly specialized advanced declarative structures designed to optimize rendering speed and orchestrate layout semantics.

---

## 1. Asynchronous Loading & Suspense (`lazy.js`)

Ryunix features a native Suspense model capable of halting the UI tree to fetch and execute external JS chunks dynamically.

### `lazy(importFn)`
A wrapper that transforms a standard `import()` physical chunk into a Ryunix Virtual DOM element.
- Initial render flags the internal `status` as `PENDING`, synchronously returning `null`.
- The `useEffect` block detects the internal Promise and binds a state-mutation listener (`forceUpdate`) once the background script evaluation fully resolves or throws an error.
- **SSR Integration**: If executed on a server runtime, `lazy` flags `_isLazy = true` so the SSR engine knows exactly where the streaming pipe needs to pause and branch.

### `<Suspense fallback={...}>`
An orchestration boundary component.
It transparently maps over its direct children array probing for `child.type._isLazy`. If a child is `PENDING`, Suspense prevents the unstyled void from painting and universally substitutes the layout with the declarative `fallback` element until the deepest asynchronous `resolve()` completes.

### `preload(importFn)`
A manual network prioritization API. Evaluates the `importFn()` immediately triggering a background HTTP fetch instead of waiting for the Reconciler to mount the component lazily logic.

---

## 2. Rendering Memoization (`memo.js`)

To drastically prevent expensive UI segments from unnecessarily re-evaluating when generic parent layouts mutate.

### `memo(Component, arePropsEqual)`
Constructs a Higher-Order Ryunix Component.
- Maintains `prevProps` and `prevResult` instances exclusively localized within closure scope.
- By default, Ryunix injects `shallowEqual` mapping `Object.keys()` to explicitly intercept the Reconciler if the exact reference identities of string/number/boolean props remained untouched.
- Optionally accepts `deepEqual` to aggressively cache evaluation outputs for large, heavily nested prop structures.

---

## 3. DOM Escape Hatches & Portals

Sometimes structural hierarchy limits visual behavior (e.g. `overflow: hidden` containers truncating modal popups).

### `createPortal(children, container)` (`portal.js`)
Returns a Virtual node internally marked with a `RYUNIX_PORTAL` Javascript `Symbol`.
Instead of appending the evaluated component locally to the previous `fiber.parent.dom`, the engine physically ejects the DOM nodes (`appendChild`) pointing them explicitly into the targeted `containerInfo` attached to `document.body` or `#modal-root`.
Despite being physically disjointed in the HTML, the Portal conceptually remains firmly inside the Ryunix component hierarchy, freely inheriting `createContext` references safely.

### `forwardRef(render)` (`forwardRef.js`)
Due to internal compiler heuristics, `ref` properties are intercepted and stripped by the core engine before they logically reach component function execution blocks.
`forwardRef` extracts the reserved `ref` trait dynamically from the compiler args and injects it seamlessly as the secondary function argument implicitly `(props, ref) => {}`.
