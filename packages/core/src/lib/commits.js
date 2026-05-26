import { updateDom } from './dom.js'
import { cancelEffects, cancelEffectsDeep } from './effects.js'
import { EFFECT_TAGS, RYUNIX_TYPES, getState, is } from '../utils/index.js'
import { RYUNIX_PORTAL } from './portal.js'
import { logHydrationUnmatchedNodes } from './hydrationLog.js'
const runLayoutEffects = (fiber) => {
  if (!fiber?.hooks?.length) return
  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i]
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
const runNormalEffects = (fiber) => {
  if (!fiber?.hooks?.length) return
  for (let i = 0; i < fiber.hooks.length; i++) {
    const hook = fiber.hooks[i]
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
function commitRoot() {
  const state = getState()
  state.deletions.forEach(commitWork)
  const finishedWork = state.wipRoot
  state.currentRoot = finishedWork
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
function commitWork(fiber) {
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
    cancelEffectsDeep(fiber)
    commitDeletion(fiber, domParent)
    return
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
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
