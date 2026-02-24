let isBatching = false
let pendingUpdates = []

/**
 * The `batchUpdates` function in JavaScript allows for batching multiple updates and flushing them all
 * at once.
 * @param callback - The `callback` parameter in the `batchUpdates` function is a function that will be
 * executed within a batch update. This function can contain multiple updates that need to be processed
 * together in a batch to improve performance and avoid unnecessary re-renders.
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
 * The `queueUpdate` function adds an update to a queue and flushes the updates if not currently
 * batching.
 * @param update - The `update` parameter is the new update that needs to be added to the queue for
 * processing.
 */
const queueUpdate = (update) => {
  pendingUpdates.push(update)

  if (!isBatching) {
    flushUpdates()
  }
}

/**
 * The `flushUpdates` function processes and executes pending updates stored in an array.
 * @returns If the `pendingUpdates` array is empty, the `flushUpdates` function will return nothing
 * (undefined).
 */
const flushUpdates = () => {
  if (pendingUpdates.length === 0) return

  const updates = pendingUpdates
  pendingUpdates = []

  // Execute all updates
  updates.forEach((update) => update())
}

export { batchUpdates, queueUpdate, flushUpdates }
