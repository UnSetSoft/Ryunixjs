import { RYUNIX_TYPES, STRINGS, is } from '../utils/index.js'
const isEvent = (key) => key.startsWith('on')
const isProperty = (key) => key !== STRINGS.CHILDREN && !isEvent(key)
const isNew = (prev, next) => (key) => {
  return !Object.is(prev[key], next[key])
}
const isGone = (next) => (key) => !(key in next)
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
