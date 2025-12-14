import { updateDom } from './dom'
import { cancelEffects, cancelEffectsDeep, runEffects } from './effects'
import { EFFECT_TAGS, getState } from '../utils/index'

/**
 * Commit root changes to DOM
 */
const commitRoot = () => {
  const state = getState()

  // Process deletions first
  state.deletions.forEach(commitWork)

  // Commit work-in-progress tree
  if (state.wipRoot?.child) {
    commitWork(state.wipRoot.child)
  }

  // Update current root reference
  state.currentRoot = state.wipRoot
  state.wipRoot = null
}

/**
 * Commit work for a fiber node
 */
const commitWork = (fiber) => {
  if (!fiber) return

  // Find parent DOM node
  let domParentFiber = fiber.parent
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  if (!domParentFiber) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('No DOM parent found for fiber')
    }
    return
  }

  const domParent = domParentFiber.dom

  try {
  // Handle different effect tags
    if (fiber.effectTag === EFFECT_TAGS.PLACEMENT) {
      if (fiber.dom) {
        domParent.appendChild(fiber.dom)
      }
      runEffects(fiber)
    } else if (fiber.effectTag === EFFECT_TAGS.UPDATE) {
      cancelEffects(fiber)
      if (fiber.dom && fiber.alternate) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
      }
      runEffects(fiber)
    } else if (fiber.effectTag === EFFECT_TAGS.DELETION) {
      cancelEffectsDeep(fiber)
      commitDeletion(fiber, domParent)
      return // Don't process children/siblings of deleted nodes
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error committing work:', error, fiber)
    }
  }

  // Recursively commit children and siblings
  if (fiber.child) commitWork(fiber.child)
  if (fiber.sibling) commitWork(fiber.sibling)
}

/**
 * Remove fiber's DOM node from parent
 */
const commitDeletion = (fiber, domParent) => {
  if (!fiber || !domParent) return

  try {
    if (fiber.dom) {
      // Direct DOM node - remove it
      domParent.removeChild(fiber.dom)
    } else {
      // Function component - recursively find and remove child DOM nodes
      let child = fiber.child
      while (child) {
        commitDeletion(child, domParent)
        child = child.sibling
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error during deletion:', error)
    }
  }
}

export { commitDeletion, commitWork, commitRoot }