import { updateDom } from './dom.js'
import { cancelEffects, cancelEffectsDeep } from './effects.js'
import { EFFECT_TAGS, RYUNIX_TYPES, getState, is } from '../../utils/index.js'
import { RYUNIX_PORTAL } from '../render/portal.js'
import { logHydrationUnmatchedNodes } from '../hydration/log.js'
import type { RyunixFiber, RyunixHook } from '../../types/internal.js'

type LayoutHook = RyunixHook & { isLayout?: boolean }

/**
 * Run layout effects (useLayoutEffect) synchronously during commit.
 * These run after DOM mutations but before the browser paints.
 */
const runLayoutEffects = (fiber: RyunixFiber) => {
  if (!fiber?.hooks?.length) return

  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i] as LayoutHook

    if (
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      hook.isLayout &&
      is.function(hook.effect)
    ) {
      if (is.function(hook.cancel)) {
        try {
          hook.cancel()
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in layout effect cleanup:', error)
          }
        }
      }

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
const runNormalEffects = (fiber: RyunixFiber) => {
  if (!fiber?.hooks?.length) return

  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i] as LayoutHook

    if (
      hook.type === RYUNIX_TYPES.RYUNIX_EFFECT &&
      !hook.isLayout &&
      is.function(hook.effect)
    ) {
      if (is.function(hook.cancel)) {
        try {
          hook.cancel()
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in effect cleanup:', error)
          }
        }
      }

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
  if (!finishedWork) return

  state.currentRoot = finishedWork

  if (state.isHydrating || state.hydrationFailed) {
    if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
      console.log(
        `[Ryunix Debug] commitRoot - isHydrating: ${state.isHydrating}, hydrationFailed: ${state.hydrationFailed}`,
      )
    }
    if (state.hydrationFailed) {
      // Defer clearing to recoverHydrationFailureIfNeeded → renderSubtree.
    } else {
      let cursor = state.hydrateCursor
      let removed = 0
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
          removed++
        }
        cursor = next
      }
      logHydrationUnmatchedNodes(removed)
    }

    state.isHydrating = false
    state.hydrationFailed = false
    state.hydrateCursor = null
  }

  commitWork(finishedWork.child)

  if (state.wipRoot === finishedWork) {
    state.wipRoot = null
  }
}

function commitWork(fiber: RyunixFiber | null | undefined) {
  if (!fiber) {
    return
  }

  if (fiber.type === RYUNIX_PORTAL || fiber._isPortal) {
    const portalContainer = fiber.containerInfo
    if (portalContainer) {
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
  if (!domParent) return

  if (fiber.effectTag === EFFECT_TAGS.PLACEMENT) {
    if (fiber.dom != null) {
      if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
        console.log('[Ryunix Debug] Appending PLACEMENT:', fiber.type)
      }
      domParent.appendChild(fiber.dom)
    }
    runLayoutEffects(fiber)
    runNormalEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.UPDATE) {
    cancelEffects(fiber)
    if (fiber.dom != null) {
      updateDom(
        fiber.dom as HTMLElement | Text,
        fiber.alternate?.props,
        fiber.props,
      )
    }
    runLayoutEffects(fiber)
    runNormalEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.HYDRATE) {
    const state = getState()
    if (state.hydrationFailed) {
      if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
        console.log('[Ryunix Debug] Hydration fallback PLACEMENT:', fiber.type)
      }
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
        updateDom(fiber.dom as HTMLElement | Text, {}, fiber.props)
      }
      runLayoutEffects(fiber)
      runNormalEffects(fiber)
    }
  } else if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    cancelEffectsDeep(fiber)
    commitDeletion(fiber, domParent as Node)
    return
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const commitPortalWork = (
  fiber: RyunixFiber | null | undefined,
  portalContainer: Element | DocumentFragment,
) => {
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
      updateDom(
        fiber.dom as HTMLElement | Text,
        fiber.alternate?.props,
        fiber.props,
      )
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

const commitDeletion = (fiber: RyunixFiber, domParent: Node) => {
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
