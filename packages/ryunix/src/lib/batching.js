let isBatching = false
let pendingUpdates = []

/**
 * Batch multiple state updates into single render
 */
const batchUpdates = (callback) => {
  const wasBatching = isBatching
  isBatching = true

  try {
    callback()
  } finally {
    isBatching = wasBatching

    if (!isBatching && pendingUpdates.length > 0) {
      flushUpdates()
    }
  }
}

/**
 * Queue update for batching
 */
const queueUpdate = (update) => {
  pendingUpdates.push(update)

  if (!isBatching) {
    flushUpdates()
  }
}

/**
 * Flush all pending updates
 */
const flushUpdates = () => {
  if (pendingUpdates.length === 0) return

  const updates = pendingUpdates
  pendingUpdates = []

  // Execute all updates
  updates.forEach((update) => update())
}

export { batchUpdates, queueUpdate, flushUpdates }
