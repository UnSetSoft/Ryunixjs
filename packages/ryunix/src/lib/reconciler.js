import { EFFECT_TAGS, getState } from '../utils/index'

/**
 * Reconcile children with key optimization
 */
const reconcileChildren = (wipFiber, elements) => {
  const state = getState()
  let index = 0
  let prevSibling

  // Build map of old fibers by key/index
  const oldFiberMap = new Map()
  let oldFiber = wipFiber.alternate?.child
  let position = 0

  while (oldFiber) {
    const key = oldFiber.key ?? `__index_${position}__`
    oldFiberMap.set(key, oldFiber)
    oldFiber = oldFiber.sibling
    position++
  }

  // Process new elements
  while (index < elements.length) {
    const element = elements[index]
    if (!element) {
      index++
      continue
    }

    const key = element.key ?? `__index_${index}__`
    const matchedFiber = oldFiberMap.get(key)

    let newFiber
    const sameType = matchedFiber && element.type === matchedFiber.type

    if (sameType) {
      // Update existing fiber
      newFiber = {
        type: matchedFiber.type,
        props: element.props,
        dom: matchedFiber.dom,
        parent: wipFiber,
        alternate: matchedFiber,
        effectTag: EFFECT_TAGS.UPDATE,
        hooks: matchedFiber.hooks,
        key: element.key,
      }
      oldFiberMap.delete(key)
    } else {
      // Create new fiber
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
        key: element.key,
      }

      // Mark matched fiber for deletion if exists
      if (matchedFiber) {
        matchedFiber.effectTag = EFFECT_TAGS.DELETION
        state.deletions.push(matchedFiber)
        oldFiberMap.delete(key)
      }
    }

    // Link fibers
    if (index === 0) {
      wipFiber.child = newFiber
    } else if (newFiber) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  // Delete remaining old fibers
  oldFiberMap.forEach((fiber) => {
    fiber.effectTag = EFFECT_TAGS.DELETION
    state.deletions.push(fiber)
  })
}

export { reconcileChildren }
