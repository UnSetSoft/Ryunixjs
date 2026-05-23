# RyunixJS DevTools & Performance Profiler

Ryunix incorporates an internal diagnostics subsystem strictly enabled when
`process.env.NODE_ENV !== 'production'`. These files provide developers with
immediate CLI runtime warnings and precision performance tracking without
downloading external browser extensions.

---

## Table of contents

- [RyunixJS DevTools & Performance Profiler](#ryunixjs-devtools--performance-profiler)
  - [Table of contents](#table-of-contents)
  - [1. Developer Tooling (`devtools.js`)](#1-developer-tooling-devtoolsjs)
  - [2. In-Memory Performance Profiler (`profiler.js`)](#2-in-memory-performance-profiler-profilerjs)

---

## 1. Developer Tooling (`devtools.js`)

Provides unified generic console interception layers.

- **`warning(condition, message)` / `error(message)` / `deprecated()`**:

  Strictly gated wrappers around the native `console` API. They aggressively
  tree-shake themselves out of the production bundle cleanly returning
  `undefined`.

- **`validateHookContext(hookName)`**: Injected into every single hook

  initialize call (`useStore`, `useEffect`, etc.). It queries
  `getState().wipFiber`. If a fiber is not actively rendering, it throws an
  explicit error protecting developers from invoking hooks inside standard
  asynchronous JS closures globally.

- **`getComponentName()`**: Evaluates `<Component />` function tags safely

  returning `anonymous` fallback text to prevent crashes when graphing the
  Virtual DOM internally.

---

## 2. In-Memory Performance Profiler (`profiler.js`)

Unlike standard Webpack profilers, Ryunix measures component rendering times
fundamentally from within the exact `requestIdleCallback` V-DOM thread
boundaries.

### `Profiler` Core Runtime

A global class instance caching the execution durations within a `measures: Map`
utilizing the native `performance.now()` API to capture exact microsecond
resolutions.

- Re-renders are stored internally within a fixed `maxSamples = 100` length

  circular buffer array to prevent memory bloat over prolonged debugging
  sessions.

- **`logStats()`**: Fires a compiled report strictly to the Browser console

  summarizing the `count`, `avg`, `min`/`max` timings, and dynamically
  calculating the `getSlowestComponents(limit = 10)` to physically narrow down
  bottlenecked components easily.

### Component Wrappers

Ryunix exposes developer-facing integrations to plug specific components into
the Profiler pipeline dynamically.

- **`withProfiler(Component, name)`**: A Higher-Order Component returning a

  function that inherently calls `profiler.startMeasure(name)` precisely before
  evaluation and `profiler.endMeasure()` immediately afterward.

- **`useProfiler(componentName)`**: A declarative Hook. Initiating it maps a

  timestamp. Returning the inner closure executes the differential calculus
  safely reporting the delta execution `duration` synchronously back to the
  `profiler.recordRender` pipeline.
