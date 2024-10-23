import { RYUNIX_TYPES, STRINGS } from '../utils/index'

/**
 * Checks if a key is an event handler (i.e., starts with 'on').
 * @param key - The key to check.
 * @returns A boolean indicating if the key is an event.
 */
const isEvent = (key) => key.startsWith('on')

/**
 * Checks if a key is a property (not 'children' and not an event).
 * @param key - The key to check.
 * @returns A boolean indicating if the key is a property.
 */
const isProperty = (key) => key !== STRINGS.children && !isEvent(key)

/**
 * Checks if a property has changed between the previous and next props.
 * @param prev - The previous props object.
 * @param next - The next props object.
 * @returns A function that takes a key and returns true if the property has changed.
 */
const isNew = (prev, next) => (key) => prev[key] !== next[key]

/**
 * Checks if a property is no longer present in the next props.
 * @param next - The next props object.
 * @returns A function that takes a key and returns true if the property is not present in the next props.
 */
const isGone = (next) => (key) => !(key in next)

/**
 * Checks if the dependencies for a hook have changed.
 * @param prevDeps - The previous dependencies array.
 * @param nextDeps - The next dependencies array.
 * @returns A boolean indicating if the dependencies have changed.
 */
const hasDepsChanged = (prevDeps, nextDeps) =>
  !prevDeps ||
  !nextDeps ||
  prevDeps.length !== nextDeps.length ||
  prevDeps.some((dep, index) => dep !== nextDeps[index])

/**
 * Cancels all effect hooks in a given fiber.
 * @param fiber - The fiber object containing hooks.
 */
const cancelEffects = (fiber) => {
  if (fiber.hooks) {
    fiber.hooks
      .filter((hook) => hook.tag === RYUNIX_TYPES.RYUNIX_EFFECT && hook.cancel)
      .forEach((effectHook) => {
        effectHook.cancel()
      })
  }
}

/**
 * Runs all effect hooks in a given fiber.
 * @param fiber - The fiber object containing hooks.
 */
const runEffects = (fiber) => {
  if (fiber.hooks) {
    fiber.hooks
      .filter((hook) => hook.tag === RYUNIX_TYPES.RYUNIX_EFFECT && hook.effect)
      .forEach((effectHook) => {
        effectHook.cancel = effectHook.effect()
      })
  }
}

export {
  runEffects,
  cancelEffects,
  isEvent,
  isProperty,
  isNew,
  isGone,
  hasDepsChanged,
}
