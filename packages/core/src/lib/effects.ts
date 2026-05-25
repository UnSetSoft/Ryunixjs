import { RYUNIX_TYPES, STRINGS, is } from '../utils/index.js'

/** @typedef {import('../types/internal.js').RyunixFiber} RyunixFiber */
/** @typedef {import('../types/internal.js').RyunixHook} RyunixHook */

/**
 * @param {string} key
 * @returns {boolean}
 */
const isEvent = (key) => key.startsWith('on')

/**
 * @param {string} key
 * @returns {boolean}
 */
const isProperty = (key) => key !== STRINGS.CHILDREN && !isEvent(key)

/**
 * @param {Record<string, unknown>} prev
 * @param {Record<string, unknown>} next
 */
const isNew = (prev, next) => /** @param {string} key */ (key) => {
  return !Object.is(prev[key], next[key])
}

/**
 * @param {Record<string, unknown>} next
 */
const isGone = (next) => /** @param {string} key */ (key) => !(key in next)

/**
 * @param {RyunixFiber} fiber
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
        if (hook.cancel) hook.cancel()
        hook.cancel = null
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in effect cleanup:', error)
        }
      }
    })
}

/**
 * @param {RyunixFiber} fiber
 */
const cancelEffectsDeep = (fiber) => {
  if (!fiber) return

  if (fiber.hooks?.length) {
    fiber.hooks
      .filter(
        (hook) =>
          hook.type === RYUNIX_TYPES.RYUNIX_EFFECT && is.function(hook.cancel),
      )
      .forEach((hook) => {
        try {
          if (hook.cancel) hook.cancel()
          hook.cancel = null
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in deep effect cleanup:', error)
          }
        }
      })
  }

  if (fiber.child) cancelEffectsDeep(fiber.child)
  if (fiber.sibling) cancelEffectsDeep(fiber.sibling)
}

export { cancelEffects, cancelEffectsDeep, isEvent, isProperty, isNew, isGone }
