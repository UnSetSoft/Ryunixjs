/**
 * Bridge module to break circular dependencies between hooks and workers.
 */

import type { RyunixRootFiber, ScheduleWorkFn } from '../../types/internal.js'

let scheduleWorkFn: ScheduleWorkFn | null = null

export const setScheduleWork = (fn: ScheduleWorkFn) => {
  scheduleWorkFn = fn
}

export const scheduleWork = (root: RyunixRootFiber, priority?: number) => {
  if (scheduleWorkFn) {
    return scheduleWorkFn(root, priority)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Ryunix] scheduleWork called before being initialized.')
  }
}
