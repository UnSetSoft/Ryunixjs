import { updateDom } from './dom'
import { cancelEffects, cancelEffectsDeep, runEffects } from './effects'
import { EFFECT_TAGS, getState } from '../utils/index'

/**
 * The `commitRoot` function commits the changes made to the virtual DOM by updating the actual DOM.
 */
const commitRoot = () => {
  const state = getState()
  state.deletions.forEach(commitWork)

  const finishedWork = state.wipRoot

  // Swap the currentRoot pointer BEFORE running effects
  // This allows dispatches inside effects to base their new work on the just-finished tree
  state.currentRoot = finishedWork

  commitWork(finishedWork.child)

  // If wipRoot was not reassigned by a synchronous dispatch during effects, clear it
  if (state.wipRoot === finishedWork) {
    state.wipRoot = null
  }
}

const commitWork = (fiber) => {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (fiber.effectTag === EFFECT_TAGS.PLACEMENT) {
    if (fiber.dom != null) {
      domParent.appendChild(fiber.dom)
    }
    runEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.UPDATE) {
    cancelEffects(fiber)
    if (fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }
    runEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.HYDRATE) {
    // Only attach event listeners and fix props, do not append to domParent
    if (fiber.dom != null) {
      updateDom(fiber.dom, {}, fiber.props)
    }
    runEffects(fiber)
  } else if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    cancelEffectsDeep(fiber)
    commitDeletion(fiber, domParent)
    return
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
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
