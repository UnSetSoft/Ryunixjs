import { rIC } from '../utils/index.js'

export const Priority = {
  IMMEDIATE: 1,
  USER_BLOCKING: 2,
  NORMAL: 3,
  LOW: 4,
  IDLE: 5,
} as const

type PriorityLevel = (typeof Priority)[keyof typeof Priority]

interface PendingUpdate {
  callback: () => void
  priority: number
  timestamp: number
}

let currentPriority: number = Priority.NORMAL

let pendingUpdates: PendingUpdate[] = []

let isScheduling = false

export function scheduleUpdate(
  callback: () => void,
  priority: number = Priority.NORMAL,
): void {
  pendingUpdates.push({ callback, priority, timestamp: Date.now() })

  if (!isScheduling) {
    isScheduling = true
    rIC(processPendingUpdates)
  }
}

function processPendingUpdates(deadline: {
  timeRemaining: () => number
}): void {
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

export function runWithPriority<T>(
  priority: PriorityLevel | number,
  callback: () => T,
): T {
  const previousPriority = currentPriority
  currentPriority = priority

  try {
    return callback()
  } finally {
    currentPriority = previousPriority
  }
}

export function getCurrentPriority(): number {
  return currentPriority
}

export function createPriorityDispatch(
  dispatch: (action: unknown, priority?: number) => void,
): (action: unknown, priority?: number) => void {
  return (action, priority = currentPriority) => {
    scheduleUpdate(() => dispatch(action), priority)
  }
}
