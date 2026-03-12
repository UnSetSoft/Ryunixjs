# Ryunix State and Priority Scheduling

Ryunix introduces a smart priority-based scheduling system on top of its state dispatcher, ensuring that critical user interactions do not drop frames while heavy renders execute.

## Priority Levels

The `Priority` enum (`priority.js`) defines five tiers of urgency:
- `IMMEDIATE (1)`: User input (typing, clicks, drags).
- `USER_BLOCKING (2)`: Hover events, fast scrolls.
- `NORMAL (3)`: Data fetching finishes, generic state updates.
- `LOW (4)`: Analytics events, prefetching data.
- `IDLE (5)`: Off-screen background tasks.

## Priority Scheduling

### `scheduleUpdate(callback, priority)`
Pushes a state update and its urgency into the `pendingUpdates` queue. Uses `requestIdleCallback` (rIC) to flush updates when the main thread isn't busy.

### `processPendingUpdates(deadline)`
Sorts the update queue based on priority (`a.priority - b.priority`). It pulls the highest priority task and executes it. 

### `runWithPriority(priority, callback)`
Temporarily elevates the context priority while executing the callback, then restores the previous priority.

## Hook Implementations

- **`useStorePriority`**: A low-level dispatcher that wraps `useReducer`. It delegates the dispatch queueing to `scheduleUpdate`.
- **`useTransition`**: Leverages `useStorePriority`. It dispatches the pending state (`isPending = true`) as `IMMEDIATE`, but immediately schedules the actual work (the callback) as `LOW` priority, yielding the main thread.
- **`useDeferredValue`**: Leverages a 100ms debouncing `setTimeout` alongside `Priority.LOW` to delay re-rendering expensive calculated text/data.

## Update Batching

### `batchUpdates(callback)`
Found in `batching.js`, this groups multiple synchronous state updates into a single render cycle.

- When `isBatching` is strictly true, standard `queueUpdate()` calls are intercepted and stalled in a `pendingUpdates` array.
- Upon completion of the callback, the finally block resolves `flushUpdates()`, mapping through the queued updates and triggering a single `scheduleWork()` tree recalculation.
