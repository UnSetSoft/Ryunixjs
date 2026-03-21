# RyunixJS Hooks Internal Engine

RyunixJS implements a robust Hooks Engine that couples state and side-effects elegantly into the Fiber tree architecture.

Rather than maintaining a global array of states natively, each functional component holds its own sequential `hooks` array internally stored in its active Fiber instance. During every render, `state.hookIndex` increments dynamically to fetch or initialize the correct hook object. 

---

## 1. State Management (`hooks.js`)

### `useReducer(reducer, initialState, init, defaultPriority)`
The fundamental building block of all statefulness in RyunixJS. 
- **Hook Structure**: Initializes an object `{ hookID, type: RYUNIX_STORE, state, queue: [] }`.
- **Queuing & Dispatching**: When `dispatch(action)` is called, the action is pushed to `hook.queue`. Crucially, it copies `currentState.currentRoot` to `wipRoot` and fires `queueUpdate(() => scheduleWork())` to restart the render loop with the designated `Priority`.
- **Evaluation**: Upon the next render cycle, any stored actions inside the `queue` array are sequentially fed into the reducer to calculate the new derived state synchronously before execution resumes.

### `useStore(initialState, priority)`
Conceptually identical to React's `useState`. It is entirely a syntactical wrapper around `useReducer`, employing an inline passthrough reducer: `(state, action) => is.function(action) ? action(state) : action`.

---

## 2. Side-Effects Pipeline (`effects.js`)

Unlike rendering which traverses downwards recursively in an interruptible loop, the execution phase of Side Effects happens directly alongside the DOM commit phase to strictly control UI consistency.

Ryunix evaluates Side-Effects efficiently utilizing reference equality checks on a dependency array `deps`. `haveDepsChanged()` iterates through `prevDeps` and `nextDeps` leveraging `Object.is()` semantics (perfect handling for `-0`, `+0`, and `NaN`).

### 1. `useLayoutEffect(callback, deps)`
This hook mimics `useEffect`, however:
- It runs **synchronously** during the `commits.js` phase immediately after DOM trees are surgically updated.
- It intentionally delays browser paint.
- It guarantees that developers can invoke expensive layout recalculations (e.g. `Element.getBoundingClientRect()`) without exposing an unstyled frame layout jitter.

### 2. `useEffect(callback, deps)`
- Marks the hook with `RYUNIX_TYPES.RYUNIX_EFFECT`.
- Executes **asynchronously** after the browser has completed its painting phase (`runNormalEffects`).
- Ensures that heavy side-effects (like Network I/O or polling subscriptions) do not block the UI from immediately responding to interactive state changes.

### Cancellation (`cancelEffects` & `cancelEffectsDeep`)
When a Fiber receives an `EFFECT_TAGS.UPDATE` or `EFFECT_TAGS.DELETION`, RyunixJS explicitly garbage collects stale side-effects:
1. It validates if the previous `hook.effect` returned a cleanup function (`hook.cancel`).
2. If available, it executes the cleanup sequentially.
3. Automatically sets `hook.cancel = null` to aggressively assist the V8 garbage collector and eradicate memory leaks.

---

## 3. Performance Memoization

To prevent redundant tree re-evaluations, Ryunix provides dependency-tracked derivation lockers.

### `useMemo(compute, deps)`
Calculates the closure block *only* if `haveDepsChanged` returns true. If variables are structurally identical, it skips execution and returns the cached `oldHook.value`, bypassing CPU penalties.

### `useCallback(callback, deps)`
An internal syntactic sugar pattern overlaying `useMemo`. Instead of returning a resolved value, it returns evaluating `useMemo(() => callback, deps)`, rigidly binding the function reference identity to prevent recursive cascading re-renders across memoized child tree components.

---

## 4. Environment Safety & SSR

All standard hooks are completely shielded against Node.js runtime hazards.
Ryunix enforces an aggressive `if (typeof window === "undefined" || state.isServerRendering)` boundary. When hooks execute on the server, Ryunix surgically aborts the dispatcher linking and gracefully returns a static snapshot of `initialState` or `compute()`, prohibiting unpredictable Node.js memory faults or undefined `window` runtime exceptions.
