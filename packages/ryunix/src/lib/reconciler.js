import { EFFECT_TAGS, vars } from '../utils/index'

/**
 * This function reconciles the children of a fiber node with a new set of elements, creating new
 * fibers for new elements, updating existing fibers for elements with the same type, and marking old
 * fibers for deletion if they are not present in the new set of elements.
 * @param wipFiber - A work-in-progress fiber object representing a component or element in the virtual
 * DOM tree.
 * @param elements - an array of elements representing the new children to be rendered in the current
 * fiber's subtree
 */
const reconcileChildren = (wipFiber, elements) => {
  console.log('[reconcileChildren] Start reconciliation for fiber:', wipFiber)
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  const oldFibersMap = new Map()
  while (oldFiber) {
    const oldKey = oldFiber.props.key || oldFiber.type
    oldFibersMap.set(oldKey, oldFiber)
    oldFiber = oldFiber.sibling
  }

  while (index < elements.length) {
    const element = elements[index]
    const key = element.props.key || element.type
    const oldFiber = oldFibersMap.get(key)

    let newFiber
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
      }
      oldFibersMap.delete(key)
    } else if (element) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: undefined,
        parent: wipFiber,
        alternate: undefined,
        effectTag: EFFECT_TAGS.PLACEMENT,
      }
    }

    if (newFiber) {
      console.log('[reconcileChildren] New fiber created:', newFiber)
      // Ensure hooks and state are properly initialized for new fibers
      if (!newFiber.alternate) {
        newFiber.hooks = []
      } else {
        newFiber.hooks = newFiber.alternate.hooks || []
      }

      // Synchronize state between parent and child fibers
      if (wipFiber.hooks) {
        newFiber.hooks = wipFiber.hooks.map((hook) => ({ ...hook }))
        newFiber.hooks.forEach((hook) => {
          if (hook.queue && hook.queue.length > 0) {
            hook.state = hook.queue.reduce((state, action) => {
              return typeof action === 'function' ? action(state) : action
            }, hook.state)
            hook.queue = []
          } else {
            console.warn('[reconcileChildren] Hook queue is undefined or empty:', hook)
          }
        })
      }
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (prevSibling) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  oldFibersMap.forEach((oldFiber) => {
    oldFiber.effectTag = EFFECT_TAGS.DELETION
    vars.deletions.push(oldFiber)
  })

  console.log(
    '[reconcileChildren] Reconciliation complete for fiber:',
    wipFiber,
  )
}

export { reconcileChildren }
