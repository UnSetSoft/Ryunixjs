# Ryunix DevTools & Profiling

Ryunix includes zero-cost runtime utilities (`devtools.js` & `profiler.js`) that safely compile out of production builds but provide immense insight during development.

## Developer Utilities

### Hook Context Validation
The `validateHookContext()` forces runtime invariants. If a developer attempts to call a Hook (like `useStore`) outside of the render cycle or in a standard JS closure, it explicitly checks if `state.wipFiber` exists, throwing an immediate stack trace before Ryunix enters an undefined state.

### Deprecation & Warning Logging
Smart runtime loggers `warning(condition, message)` and `deprecated(oldAPI, newAPI, version)` only trigger when `process.env.NODE_ENV !== 'production'`, keeping the application logic pristine.

## Performance Profiler

The singleton `Profiler` class uses the high-resolution `performance.now()` Web API.

### Recording Render Cycles
In development, component lifecycle metrics are funneled through the Profiler.
- It buffers the last `100` (`maxSamples`) render records.
- Extracts standard metrics: Average, Min, Max, and Total render timings.

### Hooks & HOCs

- **`useProfiler(componentName)`**: A hook that starts a timer on initialization and ends it when the component function physically returns.
- **`withProfiler(Component, name)`**: A Higher-Order Component wrap that intercepts props and calculates the full execution time, piping it safely to `recordRender()`.

### Diagnostics
By accessing the CLI or DevTools bridges to execute `profiler.logStats()`, the compiler neatly groups and calculates the "Top 5 Slowest performing components", enabling developers to quickly isolate bottlenecks caused by deep trees or un-memoized calculations.
