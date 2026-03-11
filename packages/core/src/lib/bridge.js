/**
 * Bridge module to break circular dependencies between hooks and workers.
 */
let scheduleWorkFn = null;

export const setScheduleWork = (fn) => {
  scheduleWorkFn = fn;
};

export const scheduleWork = (root, priority) => {
  if (scheduleWorkFn) {
    return scheduleWorkFn(root, priority);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Ryunix] scheduleWork called before being initialized.');
  }
};
