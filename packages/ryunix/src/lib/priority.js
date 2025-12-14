/**
 * Priority levels for updates
 */
const Priority = {
  IMMEDIATE: 1, // User input (clicks, typing)
  USER_BLOCKING: 2, // Hover, scroll
  NORMAL: 3, // Data fetching
  LOW: 4, // Analytics
  IDLE: 5, // Background tasks
}

let currentPriority = Priority.NORMAL
let pendingUpdates = []
let isScheduling = false

/**
 * Schedule update with priority
 */
const scheduleUpdate = (callback, priority = Priority.NORMAL) => {
  pendingUpdates.push({ callback, priority, timestamp: Date.now() })

  if (!isScheduling) {
    isScheduling = true
    requestIdleCallback(processPendingUpdates)
  }
}

/**
 * Process updates by priority
 */
const processPendingUpdates = (deadline) => {
  pendingUpdates.sort((a, b) => a.priority - b.priority)

  while (pendingUpdates.length > 0 && deadline.timeRemaining() > 1) {
    const update = pendingUpdates.shift()
    currentPriority = update.priority
    update.callback()
  }

  if (pendingUpdates.length > 0) {
    requestIdleCallback(processPendingUpdates)
  } else {
    isScheduling = false
    currentPriority = Priority.NORMAL
  }
}

/**
 * Run callback with specific priority
 */
const runWithPriority = (priority, callback) => {
  const previousPriority = currentPriority
  currentPriority = priority

  try {
    return callback()
  } finally {
    currentPriority = previousPriority
  }
}

/**
 * Get current priority
 */
const getCurrentPriority = () => currentPriority

/**
 * Wrap setState with priority
 */
const createPriorityDispatch = (dispatch) => {
  return (action, priority = currentPriority) => {
    scheduleUpdate(() => dispatch(action), priority)
  }
}

export {
  Priority,
  scheduleUpdate,
  runWithPriority,
  getCurrentPriority,
  createPriorityDispatch,
}
