let isBatching = false
let pendingUpdates = []
export function batchUpdates(callback) {
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
export function queueUpdate(update) {
  pendingUpdates.push(update)
  if (!isBatching) {
    flushUpdates()
  }
}
export function flushUpdates() {
  if (pendingUpdates.length === 0) return
  const updates = pendingUpdates
  pendingUpdates = []
  updates.forEach((update) => update())
}
