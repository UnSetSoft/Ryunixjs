# Ryunix Virtual DOM and Reconciliation Architecture

The Ryunix core employs a Fiber-based, concurrent rendering architecture, splitting the rendering work into interruptible units. This prevents blocking the main thread during deep tree updates.

## Fiber Reconciler

The reconciler (`reconciler.js`) compares the current virtual tree with the new elements to determine what needs to be created, updated, or deleted.

### `reconcileChildren(wipFiber, elements)`
- Iterates through the new elements and matches them against the old `wipFiber.alternate.child` fibers.
- **Key Optimization**: Builds an O(1) `Map` of old fibers keyed by their explicit `key` prop or their positional index. 
- Marks fibers with `EFFECT_TAGS`:
  - `PLACEMENT`: New elements added to the DOM.
  - `UPDATE`: Existing elements that changed props.
  - `DELETION`: Old elements that were removed from the tree.
  - `HYDRATE`: Existing SSR nodes that just need event listeners and logical attachment.

## Work Loop and Workers

The asynchronous execution model (`workers.js`) breaks the tree traversal into chunks.

### `performUnitOfWork(fiber)`
1. Calls component functions (`updateFunctionComponent`) or creates host DOM nodes (`updateHostComponent`).
2. Traverses down to `fiber.child`.
3. If no child, traverses to `fiber.sibling`.
4. If no sibling, traverses up to `fiber.parent` and repeats the search for the next sibling.

### `workLoop(deadline)`
Uses `requestIdleCallback` (or `setTimeout` fallback) to consume the `workQueue`. It processes `state.nextUnitOfWork` until `shouldYield` is true (less than 1ms remaining in the idle frame).

When the entire tree is processed (i.e. `nextUnitOfWork` is null), it synchronously triggers `commitRoot()`.

## Commits and Effects

The commit phase (`commits.js`) executes the calculated DOM mutations synchronously to avoid visual inconsistencies.

### `commitRoot()`
1. Executes all node `deletions` first.
2. Interchanges the active tree pointer (`state.currentRoot = finishedWork`).
3. Recursively walks the tree via `commitWork(finishedWork.child)` to run Placements, Updates, and Hydrations.
4. Cleans up stale hydration caches and nodes.

### `commitWork(fiber)`
Handles traversing and applying the targeted DOM mutations for host components and Portals.
- Triggers `runLayoutEffects` synchronously right after mutating the DOM (equivalent to `useLayoutEffect`).
- Defers `runNormalEffects` asynchronously post-paint (`useEffect`).
