import { rIC } from '../utils/index.js'
export const Priority = {
  IMMEDIATE: 1,
  USER_BLOCKING: 2,
  NORMAL: 3,
  LOW: 4,
  IDLE: 5,
}
let currentPriority = Priority.NORMAL
let pendingUpdates = []
let isScheduling = false
export function scheduleUpdate(callback, priority = Priority.NORMAL) {
  pendingUpdates.push({ callback, priority, timestamp: Date.now() })
  if (!isScheduling) {
    isScheduling = true
    rIC(processPendingUpdates)
  }
}
function processPendingUpdates(deadline) {
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
export function runWithPriority(priority, callback) {
  const previousPriority = currentPriority
  currentPriority = priority
  try {
    return callback()
  } finally {
    currentPriority = previousPriority
  }
}
export function getCurrentPriority() {
  return currentPriority
}
export function createPriorityDispatch(dispatch) {
  return (action, priority = currentPriority) => {
    scheduleUpdate(() => dispatch(action), priority)
  }
}
