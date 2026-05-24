import { rIC } from '../utils/index.js'

/**
 * Priority levels for updates
 */
const Priority = {
  IMMEDIATE: 1,
  USER_BLOCKING: 2,
  NORMAL: 3,
  LOW: 4,
  IDLE: 5,
}

/** @type {number} */
let currentPriority = Priority.NORMAL

/** @type {Array<{ callback: () => void; priority: number; timestamp: number }>} */
let pendingUpdates = []

/** @type {boolean} */
let isScheduling = false

/**
 * Schedule update with priority.
 * @param {() => void} callback
 * @param {number} [priority]
 */
const scheduleUpdate = (callback, priority = Priority.NORMAL) => {
  pendingUpdates.push({ callback, priority, timestamp: Date.now() })

  if (!isScheduling) {
    isScheduling = true
    rIC(processPendingUpdates)
  }
}

/**
 * @param {{ timeRemaining: () => number }} deadline
 */
const processPendingUpdates = (deadline) => {
  pendingUpdates.sort((a, b) => a.priority - b.priority)

  while (pendingUpdates.length > 0 && deadline.timeRemaining() > 1) {
    const update = pendingUpdates.shift()
    if (!update) break
    currentPriority = update.priority
    update.callback()
  }

  if (pendingUpdates.length > 0) {
    rIC(processPendingUpdates)
  } else {
    isScheduling = false
    currentPriority = Priority.NORMAL
  }
}

/**
 * @param {number} priority
 * @param {() => T} callback
 * @returns {T}
 * @template T
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

/** @returns {number} */
const getCurrentPriority = () => currentPriority

/**
 * @param {(action: unknown, priority?: number) => void} dispatch
 */
const createPriorityDispatch = (dispatch) => {
  /** @param {unknown} action @param {number} [priority] */
  const wrapped = (action, priority = currentPriority) => {
    scheduleUpdate(() => dispatch(action), priority)
  }
  return wrapped
}

export {
  Priority,
  scheduleUpdate,
  runWithPriority,
  getCurrentPriority,
  createPriorityDispatch,
}
