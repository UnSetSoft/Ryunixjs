import { RYUNIX_TYPES, STRINGS, is } from '../utils/index'

/**
 * Check if a key is an event handler
 * @param {string} key - Prop key
 * @returns {boolean}
 */
const isEvent = (key) => key.startsWith('on')

/**
 * Check if a key is a property (not children or event)
 * @param {string} key - Prop key
 * @returns {boolean}
 */
const isProperty = (key) => key !== STRINGS.CHILDREN && !isEvent(key)

/**
 * Check if a property is new or changed
 * @param {Object} prev - Previous props
 * @param {Object} next - Next props
 * @returns {Function}
 */
const isNew = (prev, next) => (key) => {
  // Use Object.is for better comparison (handles NaN, -0, +0)
  return !Object.is(prev[key], next[key])
}

/**
 * Check if a property was removed
 * @param {Object} next - Next props
 * @returns {Function}
 */
const isGone = (next) => (key) => !(key in next)

/**
 * Check if dependencies array has changed
 * @param {Array} prevDeps - Previous dependencies
 * @param {Array} nextDeps - Next dependencies
 * @returns {boolean}
 */
const haveDepsChanged = (prevDeps, nextDeps) => {
  if (!prevDeps || !nextDeps) return true
  if (prevDeps.length !== nextDeps.length) return true
  return prevDeps.some((dep, index) => !Object.is(dep, nextDeps[index]))
}

/**
 * Cancel effects for a single fiber
 * @param {Object} fiber - Fiber node
 */
const cancelEffects = (fiber) => {
  if (!fiber?.hooks?.length) return

  fiber.hooks
    .filter((hook) =>
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      is.function(hook.cancel)
    )
    .forEach((hook) => {
      try {
        hook.cancel()
        hook.cancel = null // Clear reference to prevent memory leaks
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in effect cleanup:', error)
        }
      }
    })
}

/**
 * Recursively cancel effects in fiber tree
 * @param {Object} fiber - Root fiber node
 */
const cancelEffectsDeep = (fiber) => {
  if (!fiber) return

  // Cancel effects for current fiber
  if (fiber.hooks?.length > 0) {
    fiber.hooks
      .filter(
        (hook) =>
          hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
          is.function(hook.cancel)
      )
      .forEach((hook) => {
        try {
          hook.cancel()
          hook.cancel = null // Clear reference
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in deep effect cleanup:', error)
          }
        }
      })
  }

  // Recursively process children
  if (fiber.child) cancelEffectsDeep(fiber.child)
  if (fiber.sibling) cancelEffectsDeep(fiber.sibling)
}

/**
 * Run effects for a fiber
 * @param {Object} fiber - Fiber node
 */
const runEffects = (fiber) => {
  if (!fiber?.hooks?.length) return

  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i]

    if (
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      is.function(hook.effect)
    ) {
      // Cancel previous cleanup if exists
      if (is.function(hook.cancel)) {
        try {
          hook.cancel()
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in effect cleanup:', error)
          }
        }
      }

      // Run new effect
      try {
        const cleanup = hook.effect()

        // Store cleanup function if returned
        if (is.function(cleanup)) {
          hook.cancel = cleanup
        } else {
          hook.cancel = null
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in effect:', error)
        }
        hook.cancel = null
      }

      // Clear effect reference after running
      hook.effect = null
    }
  }
}

/**
 * Batch multiple effect operations
 * @param {Function} callback - Callback containing effect operations
 */
const batchEffects = (callback) => {
  // Could implement batching logic here for performance
  // For now, just execute immediately
  callback()
}

export {
  runEffects,
  cancelEffects,
  cancelEffectsDeep,
  isEvent,
  isProperty,
  isNew,
  isGone,
  haveDepsChanged,
  batchEffects,
}