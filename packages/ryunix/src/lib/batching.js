import { getState } from '../utils/index'
import { scheduleWork } from './workers'

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

/**
 * Unstable feature: Concurrent mode priorities
 */
const Priority = {
  IMMEDIATE: 1,
  USER_BLOCKING: 2,
  NORMAL: 3,
  LOW: 4,
  IDLE: 5,
}

let currentPriority = Priority.NORMAL

const runWithPriority = (priority, callback) => {
  const previousPriority = currentPriority
  currentPriority = priority

  try {
    return callback()
  } finally {
    currentPriority = previousPriority
  }
}

export { batchUpdates, queueUpdate, flushUpdates, Priority, runWithPriority }
