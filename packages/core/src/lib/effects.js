import { RYUNIX_TYPES, STRINGS, is } from '../utils/index.js'

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
 * Cancel effects for a single fiber
 * @param {Object} fiber - Fiber node
 */
const cancelEffects = (fiber) => {
  if (!fiber?.hooks?.length) return

  fiber.hooks
    .filter(
      (hook) =>
        hook.type === RYUNIX_TYPES.RYUNIX_EFFECT && is.function(hook.cancel),
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
          hook.type === RYUNIX_TYPES.RYUNIX_EFFECT && is.function(hook.cancel),
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

export {
  cancelEffects,
  cancelEffectsDeep,
  isEvent,
  isProperty,
  isNew,
  isGone,
}
