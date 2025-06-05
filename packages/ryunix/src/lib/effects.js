import { RYUNIX_TYPES, STRINGS } from '../utils/index'
import { commitDeletion } from './commits'

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
  if (fiber.hooks && fiber.hooks.length > 0) {
    fiber.hooks
      .filter((hook) => hook.type === RYUNIX_TYPES.RYUNIX_EFFECT && hook.cancel)
      .forEach((effectHook) => {
        effectHook.cancel()
      })
  }
}

/**
 * The function `cancelEffectsDeep` recursively cancels effects in a fiber tree by running cleanup
 * functions for each effect hook.
 * @param fiber - The `fiber` parameter in the `cancelEffectsDeep` function seems to be an object
 * representing a fiber node in a data structure. The function recursively traverses the fiber tree to
 * find hooks with effects and cancels them by calling their `cancel` function if it exists. It also
 * logs a message
 * @returns The `cancelEffectsDeep` function does not explicitly return a value. It is a recursive
 * function that traverses a fiber tree structure and cancels effects for hooks that have a `cancel`
 * function defined. The function performs cleanup operations by calling the `cancel` function for each
 * applicable hook.
 */
const cancelEffectsDeep = (fiber) => {
  if (!fiber) return

  if (fiber.hooks && fiber.hooks.length > 0) {
    fiber.hooks
      .filter(
        (hook) =>
          hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
          typeof hook.cancel === STRINGS.function,
      )
      .forEach((hook) => {
        hook.cancel()
      })
  }

  if (fiber.child) cancelEffectsDeep(fiber.child)
  if (fiber.sibling) cancelEffectsDeep(fiber.sibling)
}

/**
 * The function runs all effect hooks in a given fiber.
 * @param fiber - The "fiber" parameter is likely referring to a data structure used in the
 * implementation of a fiber-based reconciliation algorithm, such as the one used in React. A fiber
 * represents a unit of work that needs to be performed by the reconciliation algorithm, and it
 * contains information about a component and its children, as
 */
const runEffects = (fiber) => {
  if (!fiber.hooks || fiber.hooks.length === 0) return

  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i]
    if (
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      typeof hook.effect === STRINGS.function &&
      hook.effect !== null
    ) {
      if (typeof hook.cancel === STRINGS.function) {
        hook.cancel()
      }

      const cleanup = hook.effect()

      if (typeof cleanup === 'function') {
        hook.cancel = cleanup
      } else {
        hook.cancel = undefined
      }
    }
  }
}

export {
  runEffects,
  cancelEffects,
  cancelEffectsDeep,
  isEvent,
  isProperty,
  isNew,
  isGone,
  hasDepsChanged,
}
