import { EFFECT_TAGS, getState } from '../utils/index.js'

/**
 * Reconcile children with key optimization
 */
const reconcileChildren = (wipFiber, elements) => {
  const state = getState()
  let index = 0
  let prevSibling
  let isFirstChild = true

  // Build map of old fibers by key/index
  const oldFiberMap = new Map()
  let oldFiber = wipFiber.alternate?.child
  let position = 0

  while (oldFiber) {
    const key = oldFiber.key ?? `__index_${oldFiber.index ?? position}__`
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
        stateError: matchedFiber.stateError,
        key: element.key,
        index,
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
        effectTag: state.isHydrating
          ? EFFECT_TAGS.HYDRATE
          : EFFECT_TAGS.PLACEMENT,
        key: element.key,
        index,
      }

      // Mark matched fiber for deletion if exists
      if (matchedFiber) {
        matchedFiber.effectTag = EFFECT_TAGS.DELETION
        state.deletions.push(matchedFiber)
        oldFiberMap.delete(key)
      }
    }

    // Link fibers
    if (isFirstChild) {
      wipFiber.child = newFiber
      isFirstChild = false
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
