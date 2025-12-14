import { EFFECT_TAGS, getState } from '../utils/index'

const reconcileChildren = (wipFiber, elements) => {
  const state = getState()
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber

    const sameType = oldFiber && element && element.type == oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
        hooks: oldFiber.hooks,
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = EFFECT_TAGS.DELETION
      state.deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

export { reconcileChildren }