let isBatching = false

let pendingUpdates: Array<() => void> = []

export function batchUpdates(callback: () => void): void {
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

export function queueUpdate(update: () => void): void {
  pendingUpdates.push(update)

  if (!isBatching) {
    flushUpdates()
  }
}

export function flushUpdates(): void {
  if (pendingUpdates.length === 0) return

  const updates = pendingUpdates
  pendingUpdates = []

  updates.forEach((update) => update())
}
