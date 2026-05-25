import { EFFECT_TAGS, getState } from '../utils/index.js'
import type {
  RyunixElement,
  RyunixFiber,
  RyunixNode,
} from '../types/internal.js'

const reconcileChildren = (wipFiber: RyunixFiber, elements: RyunixNode[]) => {
  const state = getState()
  let index = 0
  let prevSibling: RyunixFiber | undefined
  let isFirstChild = true

  const oldFiberMap = new Map<string | number, RyunixFiber>()
  let oldFiber = wipFiber.alternate?.child
  let position = 0

  while (oldFiber) {
    const key = oldFiber.key ?? `__index_${oldFiber.index ?? position}__`
    oldFiberMap.set(key, oldFiber)
    oldFiber = oldFiber.sibling
    position++
  }

  while (index < elements.length) {
    const element = elements[index] as RyunixElement & {
      key?: string | number
    }
    if (!element) {
      index++
      continue
    }

    const key = element.key ?? `__index_${index}__`
    const matchedFiber = oldFiberMap.get(key)

    let newFiber: RyunixFiber
    const sameType = matchedFiber && element.type === matchedFiber.type

    if (sameType && matchedFiber) {
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

      if (matchedFiber) {
        matchedFiber.effectTag = EFFECT_TAGS.DELETION
        state.deletions.push(matchedFiber)
        oldFiberMap.delete(key)
      }
    }

    if (isFirstChild) {
      wipFiber.child = newFiber
      isFirstChild = false
    } else if (prevSibling) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  oldFiberMap.forEach((fiber) => {
    fiber.effectTag = EFFECT_TAGS.DELETION
    state.deletions.push(fiber)
  })
}

export { reconcileChildren }
