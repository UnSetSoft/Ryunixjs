import { createDom } from './dom'
import { reconcileChildren } from './reconciler'
import { EFFECT_TAGS, vars } from '../utils/index'

/**
 * This function updates a function component by setting up a work-in-progress fiber, resetting the
 * hook index, creating an empty hooks array, rendering the component, and reconciling its children.
 * @param fiber - The fiber parameter is an object that represents a node in the fiber tree. It
 * contains information about the component, its props, state, and children. In this function, it is
 * used to update the state of the component and its children.
 */
const updateFunctionComponent = (fiber) => {
  vars.wipFiber = fiber
  vars.hookIndex = 0
  vars.wipFiber.hooks = []

  // Renderizar el componente y reconciliar sus hijos
  const children = fiber.type(fiber.props)
  const childArr = Array.isArray(children) ? children : [children]

  reconcileChildren(fiber, childArr)

  // Marcar el fiber para actualización
  fiber.effectTag = EFFECT_TAGS.UPDATE
}

/**
 * This function updates a host component's DOM element and reconciles its children.
 * @param fiber - A fiber is a unit of work in Ryunix that represents a component and its state. It
 * contains information about the component's type, props, and children, as well as pointers to other
 * fibers in the tree.
 */
const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

export { updateFunctionComponent, updateHostComponent }
