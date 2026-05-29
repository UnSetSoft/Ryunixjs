import { RYUNIX_TYPES, STRINGS, is } from '../../utils/index.js'
import type { RyunixFiber } from '../../types/internal.js'

const isEvent = (key: string): boolean => key.startsWith('on')

const RESERVED_DOM_PROPS = new Set(['key', 'ref', STRINGS.CHILDREN])

const isProperty = (key: string): boolean =>
  !RESERVED_DOM_PROPS.has(key) && !isEvent(key)

const isNew =
  (prev: Record<string, unknown>, next: Record<string, unknown>) =>
  (key: string): boolean => {
    return !Object.is(prev[key], next[key])
  }

const isGone =
  (next: Record<string, unknown>) =>
  (key: string): boolean =>
    !(key in next)

const cancelEffects = (fiber: RyunixFiber) => {
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

const cancelEffectsDeep = (fiber: RyunixFiber | null | undefined) => {
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
