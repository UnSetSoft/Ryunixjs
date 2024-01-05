import { RYUNIX_TYPES, STRINGS } from '../utils/index'

const isEvent = (key) => key.startsWith('on')
const isProperty = (key) => key !== STRINGS.children && !isEvent(key)
const isNew = (prev, next) => (key) => prev[key] !== next[key]
const isGone = (next) => (key) => !(key in next)
const hasDepsChanged = (prevDeps, nextDeps) =>
  !prevDeps ||
  !nextDeps ||
  prevDeps.length !== nextDeps.length ||
  prevDeps.some((dep, index) => dep !== nextDeps[index])

/**
 * The function cancels all effect hooks in a given fiber.
 * @param fiber - The "fiber" parameter is likely referring to a data structure used in React.js to
 * represent a component and its state. It contains information about the component's props, state, and
 * children, as well as metadata used by React to manage updates and rendering. The function
 * "cancelEffects" is likely intended
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
 * The function runs all effect hooks in a given fiber.
 * @param fiber - The "fiber" parameter is likely referring to a data structure used in the
 * implementation of a fiber-based reconciliation algorithm, such as the one used in React. A fiber
 * represents a unit of work that needs to be performed by the reconciliation algorithm, and it
 * contains information about a component and its children, as
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
