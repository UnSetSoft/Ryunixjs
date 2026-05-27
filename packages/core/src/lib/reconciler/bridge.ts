/**
 * Bridge module to break circular dependencies between hooks and workers.
 */

/** @type {import('../../types/internal.js').ScheduleWorkFn | null} */
let scheduleWorkFn = null

/**
 * @param {import('../../types/internal.js').ScheduleWorkFn} fn
 */
export const setScheduleWork = (fn) => {
  scheduleWorkFn = fn
}

/**
 * @param {import('../../types/internal.js').RyunixRootFiber} root
 * @param {number} [priority]
 */
export const scheduleWork = (root, priority) => {
  if (scheduleWorkFn) {
    return scheduleWorkFn(root, priority)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Ryunix] scheduleWork called before being initialized.')
  }
}
