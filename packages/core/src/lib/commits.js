import { updateDom } from './dom.js'
import { cancelEffects, cancelEffectsDeep } from './effects.js'
import { EFFECT_TAGS, RYUNIX_TYPES, getState, is } from '../utils/index.js'
import { RYUNIX_PORTAL } from './portal.js'

/**
 * Run layout effects (useLayoutEffect) synchronously during commit.
 * These run after DOM mutations but before the browser paints.
 */
const runLayoutEffects = (fiber) => {
  if (!fiber?.hooks?.length) return

  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i]

    if (
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      hook.isLayout &&
      is.function(hook.effect)
    ) {
      // Cancel previous layout cleanup if exists
      if (is.function(hook.cancel)) {
        try {
          hook.cancel()
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in layout effect cleanup:', error)
          }
        }
      }

      // Run new layout effect synchronously
      try {
        const cleanup = hook.effect()
        hook.cancel = is.function(cleanup) ? cleanup : null
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in layout effect:', error)
        }
        hook.cancel = null
      }

      hook.effect = null
    }
  }
}

/**
 * Run normal (non-layout) effects asynchronously after paint.
 */
const runNormalEffects = (fiber) => {
  if (!fiber?.hooks?.length) return

  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i]

    if (
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      !hook.isLayout &&
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
        hook.cancel = is.function(cleanup) ? cleanup : null
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in effect:', error)
        }
        hook.cancel = null
      }

      hook.effect = null
    }
  }
}

/**
 * The `commitRoot` function commits the changes made to the virtual DOM by updating the actual DOM.
 */
function commitRoot() {
  const state = getState()
  state.deletions.forEach(commitWork)

  const finishedWork = state.wipRoot

  // Swap the currentRoot pointer BEFORE running effects
  // This allows dispatches inside effects to base their new work on the just-finished tree
  state.currentRoot = finishedWork

  // After hydration is done, reset the flag and cleanup unconsumed nodes
  if (state.isHydrating || state.hydrationFailed) {
    if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
      console.log(
        `[Ryunix Debug] commitRoot - isHydrating: ${state.isHydrating}, hydrationFailed: ${state.hydrationFailed}`,
      )
    }
    if (state.hydrationFailed) {
      if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
        console.log('[Ryunix Debug] Hydration failed. Clearing container.')
      }
      const container = state.containerRoot || finishedWork.dom
      if (container) {
        container.textContent = ''
      }
    } else {
      // If there is a cursor left, it means these are SSR nodes that weren't matched
      // by any client fiber. We must remove them to avoid duplication.
      let cursor = state.hydrateCursor
      if (
        cursor &&
        process.env.NODE_ENV !== 'production' &&
        process.env.RYUNIX_DEBUG
      ) {
        console.log('[Ryunix Debug] Removing unmatched root siblings.')
      }
      while (cursor) {
        const next = cursor.nextSibling
        if (cursor.parentNode) {
          cursor.parentNode.removeChild(cursor)
        }
        cursor = next
      }
    }

    state.isHydrating = false
    state.hydrationFailed = false
    state.hydrateCursor = null
  }

  commitWork(finishedWork.child)

  // If wipRoot was not reassigned by a synchronous dispatch during effects, clear it
  if (state.wipRoot === finishedWork) {
    state.wipRoot = null
  }
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  // Handle portal fibers — they render into a different container
  if (fiber.type === RYUNIX_PORTAL || fiber._isPortal) {
    const portalContainer = fiber.containerInfo
    if (portalContainer) {
      // Process portal children into the portal container
      const portalFiber = fiber.child
      if (portalFiber) {
        commitPortalWork(portalFiber, portalContainer)
      }
    }
    commitWork(fiber.sibling)
    return
  }

  let domParentFiber = fiber.parent
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  if (!domParentFiber) {
    return
  }

  const domParent = domParentFiber.dom

  if (fiber.effectTag === EFFECT_TAGS.PLACEMENT) {
    if (fiber.dom != null) {
      if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
        console.log('[Ryunix Debug] Appending PLACEMENT:', fiber.type)
      }
      domParent.appendChild(fiber.dom)
    }
    // Layout effects run synchronously during commit
    runLayoutEffects(fiber)
    // Normal effects run after paint
    runNormalEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.UPDATE) {
    cancelEffects(fiber)
    if (fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }
    runLayoutEffects(fiber)
    runNormalEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.HYDRATE) {
    const state = getState()
    if (state.hydrationFailed) {
      if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
        console.log('[Ryunix Debug] Hydration fallback PLACEMENT:', fiber.type)
      }
      // Since container is cleared on fallback, treat as normal placement
      // No need to check fiber.dom.parentNode !== domParent because the container was cleared.
      if (fiber.dom != null) {
        domParent.appendChild(fiber.dom)
      }
      runLayoutEffects(fiber)
      runNormalEffects(fiber)
    } else {
      if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
        console.log('[Ryunix Debug] Hydrating node:', fiber.type)
      }
      if (fiber.dom != null) {
        updateDom(fiber.dom, {}, fiber.props)
      }
      runLayoutEffects(fiber)
      runNormalEffects(fiber)
    }
  } else if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    // Run cleanups BEFORE removing DOM to allow cleanup functions to read DOM state
    cancelEffectsDeep(fiber)
    commitDeletion(fiber, domParent)
    return
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

/**
 * Commit work for portal children into a specific container
 */
const commitPortalWork = (fiber, portalContainer) => {
  if (!fiber) return

  if (fiber.effectTag === EFFECT_TAGS.PLACEMENT) {
    if (fiber.dom != null) {
      portalContainer.appendChild(fiber.dom)
    }
    runLayoutEffects(fiber)
    runNormalEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.UPDATE) {
    cancelEffects(fiber)
    if (fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }
    runLayoutEffects(fiber)
    runNormalEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    cancelEffectsDeep(fiber)
    commitDeletion(fiber, portalContainer)
    return
  }

  commitPortalWork(fiber.child, portalContainer)
  commitPortalWork(fiber.sibling, portalContainer)
}

const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    if (fiber.dom.parentNode) {
      fiber.dom.parentNode.removeChild(fiber.dom)
    }
  } else {
    let child = fiber.child
    while (child) {
      commitDeletion(child, domParent)
      child = child.sibling
    }
  }
}

export { commitDeletion, commitWork, commitRoot }
