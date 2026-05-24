/** @type {boolean} */
let isBatching = false

/** @type {Array<() => void>} */
let pendingUpdates = []

/**
 * Batch multiple state updates and flush them together.
 * @param {() => void} callback - Updates to run inside the batch
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
 * Queue an update; flushes immediately unless a batch is active.
 * @param {() => void} update
 */
const queueUpdate = (update) => {
  pendingUpdates.push(update)

  if (!isBatching) {
    flushUpdates()
  }
}

/** Execute all queued updates. */
const flushUpdates = () => {
  if (pendingUpdates.length === 0) return

  const updates = pendingUpdates
  pendingUpdates = []

  updates.forEach((update) => update())
}

export { batchUpdates, queueUpdate, flushUpdates }
