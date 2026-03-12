# Ryunix Hooks System

Ryunix provides a comprehensive Hooks API, maintaining familiarity while integrating unique features for priority scheduling and routing.

## State Management

### `useStore(initialState)`
The primary state hook (analogous to React's `useState`). Under the hood, it uses `useReducer`. It returns the current state and a dispatcher function.

### `useReducer(reducer, initialState, init)`
Manages complex state logic. The dispatcher queues an action, updating the Work-In-Progress fiber, and schedules a render cycle via `scheduleWork`.

### `usePersistentStore(key, initialState)`
A specialized hook that wraps `useStore` to synchronize state with `window.localStorage`. It automatically handles serialization/deserialization.

## Side Effects & Lifecycle

### `useEffect(callback, deps)`
Runs side-effects after the render phase. Effect callbacks are executed if the dependency array changes.

### `useLayoutEffect(callback, deps)`
Runs synchronously after DOM mutations but before the browser paints. Essential for making DOM measurements to avoid visual flickering.

## Performance & Memoization

### `useMemo(compute, deps)`
Memoizes an expensive computation based on an array of dependencies.

### `useCallback(callback, deps)`
Memoizes a function reference to prevent unnecessary child component re-renders.

### `useRef(initialValue)`
Provides a mutable object that persists across renders (`hook.value.current`). It does not trigger a re-render when mutated.

## Concurrent Mode & Priority

Ryunix features a localized priority scheduler (`useStorePriority`) implemented over the base `useReducer`.

### `useTransition()`
Returns a boolean `isPending` state and a `startTransition` function. Allows marking specific state updates as non-urgent (Priority: LOW), keeping the application responsive during heavy renders.

### `useDeferredValue(value)`
Defers updates to a value by wrapping it in a setTimeout with low priority, preventing UI blocking on fast inputs.

## Context

### `createContext(contextId, defaultValue)`
Returns a `{ Provider, useContext }` pair. The internal traversal system walks up the fiber tree to find the nearest matching Provider `_contextId`.

## Routing & Navigation

Ryunix core includes built-in SPA router capabilities.

### `useRouter()`
Returns the router context (`location`, `params`, `query`, `navigate`, etc.).

### `usePathname()` & `useSearchParams()` & `useHash()`
Utility hooks that extract specific routing information from the environment. `useHash` triggers reactively on `hashchange` events.

### `useMetadata(tags, options)`
Manages SEO and document tags (Title, Canonical, OpenGraph) dynamically. On the server, it buffers metadata to be injected into the static HTML.
