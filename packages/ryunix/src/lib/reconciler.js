import { EFFECT_TAGS, getState } from '../utils/index'

/**
 * Reconcile children elements with existing fibers
 * Core diffing algorithm
 */
const reconcileChildren = (wipFiber, elements) => {
  const state = getState()

  let index = 0
  let oldFiber = wipFiber.alternate?.child
  let prevSibling = null

  // Iterate through children
  while (index < elements.length || oldFiber) {
    const element = elements[index]
    let newFiber = null

    // Compare old fiber with new element
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      // Update existing fiber
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
        hooks: oldFiber.hooks || [],
      }
    }

    if (element && !sameType) {
      // Create new fiber
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
        hooks: [],
      }
    }

    if (oldFiber && !sameType) {
      // Mark old fiber for deletion
      oldFiber.effectTag = EFFECT_TAGS.DELETION
      state.deletions.push(oldFiber)
    }

    // Move to next old fiber
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    // Link fibers - only if newFiber exists
    if (newFiber) {
      if (index === 0) {
        wipFiber.child = newFiber
      } else if (prevSibling) {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
    }

    index++
  }
}

export { reconcileChildren }