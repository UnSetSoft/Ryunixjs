import { updateDom } from './dom'
import { cancelEffects, cancelEffectsDeep, runEffects } from './effects'
import { EFFECT_TAGS, getState } from '../utils/index'

const commitRoot = () => {
  const state = getState()
  state.deletions.forEach(commitWork)
  commitWork(state.wipRoot.child)
  state.currentRoot = state.wipRoot
  state.wipRoot = null
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
    domParent.removeChild(fiber.dom)
  } else {
    let child = fiber.child
    while (child) {
      commitDeletion(child, domParent)
      child = child.sibling
    }
  }
}

export { commitDeletion, commitWork, commitRoot }