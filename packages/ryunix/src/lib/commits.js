import { updateDom } from './dom'
import { cancelEffects, runEffects } from './effects'
import { EFFECT_TAGS, vars } from '../utils/index'

/**
 * The function commits changes made to the virtual DOM to the actual DOM.
 */
const commitRoot = () => {
  vars.deletions.forEach(commitWork)
  if (vars.wipRoot && vars.wipRoot.child) {
    commitWork(vars.wipRoot.child)
    vars.currentRoot = vars.wipRoot
  }
  vars.wipRoot = undefined
}

/**
 * Helper function to find the DOM parent of a given fiber.
 * It walks up the fiber tree until it finds a parent with a DOM node.
 * @param fiber - The fiber node whose DOM parent needs to be found.
 * @returns The DOM node of the fiber's parent.
 */
const findDomParent = (fiber) => {
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  return domParentFiber.dom
}

/**
 * Safely removes a child DOM node from its parent, with error handling.
 * @param domParent - The parent DOM node.
 * @param childDom - The child DOM node to be removed.
 */
const safeRemoveChild = (domParent, childDom) => {
  try {
    domParent.removeChild(childDom)
  } catch (error) {
    console.error('Error removing DOM child:', error)
  }
}

/**
 * The function handles the deletion of a fiber's corresponding DOM node.
 * It removes the fiber's DOM element or recursively removes its child.
 * @param fiber - The fiber node to be deleted.
 * @param domParent - The parent DOM node from which the fiber's DOM node will be removed.
 */
const commitDeletion = (fiber, domParent) => {
  if (fiber && fiber.dom) {
    safeRemoveChild(domParent, fiber.dom)
  } else if (fiber && fiber.child) {
    commitDeletion(fiber.child, domParent)
  }
}

/**
 * Cleans up the effects associated with a fiber node, specifically for
 * UPDATE and DELETION effect tags.
 * @param fiber - The fiber node whose effects need to be cleaned up.
 */
const cleanupEffects = (fiber) => {
  if (fiber.effectTag === EFFECT_TAGS.UPDATE || fiber.effectTag === EFFECT_TAGS.DELETION) {
    cancelEffects(fiber)
  }
}

/**
 * An object that maps effect tags to their corresponding handling functions.
 * Each function takes a fiber node and a DOM parent, and applies the necessary changes to the DOM.
 */
const effectHandlers = {
  [EFFECT_TAGS.PLACEMENT]: (fiber, domParent) => {
    if (fiber.dom != undefined) {
      domParent.appendChild(fiber.dom)
    }
    runEffects(fiber)
  },
  [EFFECT_TAGS.UPDATE]: (fiber, domParent) => {
    cancelEffects(fiber)
    if (fiber.dom != undefined) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }
    runEffects(fiber)
  },
  [EFFECT_TAGS.DELETION]: (fiber, domParent) => {
    cancelEffects(fiber)
    commitDeletion(fiber, domParent)
  },
}

/**
 * The function commits changes made to the DOM based on the effect tag of the fiber.
 * It handles PLACEMENT, UPDATE, and DELETION of DOM nodes, and processes child and sibling fibers.
 * @param fiber - The fiber node whose changes need to be committed to the DOM.
 */
const commitWork = (fiber) => {
  if (!fiber) return

  const domParent = findDomParent(fiber)
  const effectHandler = effectHandlers[fiber.effectTag]

  if (effectHandler) {
    effectHandler(fiber, domParent)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

export { commitDeletion, commitWork, commitRoot }
