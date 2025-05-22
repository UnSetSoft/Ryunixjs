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
const shouldComponentUpdate = (oldProps, newProps) => {
  // Comparar las propiedades antiguas y nuevas
  return (
    !oldProps ||
    !newProps ||
    Object.keys(oldProps).length !== Object.keys(newProps).length ||
    Object.keys(newProps).some((key) => oldProps[key] !== newProps[key])
  )
}

const recycleFiber = (oldFiber, newProps) => {
  return {
    ...oldFiber,
    props: newProps,
    alternate: oldFiber,
    effectTag: EFFECT_TAGS.UPDATE,
  }
}

const reconcileChildren = (wipFiber, elements) => {
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

    if (sameType && !shouldComponentUpdate(oldFiber.props, element.props)) {
      // Reutilizar fibra existente si no hay cambios
      newFiber = recycleFiber(oldFiber, element.props)
      oldFibersMap.delete(key)
    } else if (sameType) {
      // Actualizar fibra existente
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
      // Crear nueva fibra
      newFiber = {
        type: element.type,
        props: element.props,
        dom: undefined,
        parent: wipFiber,
        alternate: undefined,
        effectTag: EFFECT_TAGS.PLACEMENT,
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
}

let updateQueue = []

const scheduleUpdate = (fiber, priority) => {
  updateQueue.push({ fiber, priority })
  updateQueue.sort((a, b) => a.priority - b.priority) // Ordenar por prioridad
}

const performConcurrentWork = () => {
  while (updateQueue.length > 0) {
    const { fiber } = updateQueue.shift()
    performUnitOfWork(fiber)
  }
}

const performUnitOfWork = (fiber) => {
  // Procesar la unidad de trabajo
  reconcileChildren(fiber, fiber.props.children)

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

export { reconcileChildren, scheduleUpdate, performConcurrentWork }
