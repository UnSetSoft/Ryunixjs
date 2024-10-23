import { createDom } from './dom'
import { reconcileChildren } from './reconciler'
import { vars } from '../utils/index'

/**
 * Updates a function component by setting up a work-in-progress fiber,
 * resetting the hook index, initializing an empty hooks array, rendering the component,
 * and reconciling its children.
 * 
 * @param fiber - The fiber node representing the function component being updated. It contains
 *                properties such as the component type, props, and hooks.
 */
const updateFunctionComponent = (fiber) => {
  // Set the current work-in-progress fiber
  vars.workInProgressFiber = fiber
  vars.hookIndex = 0
  vars.workInProgressFiber.hooks = []

  const children = fiber.type(fiber.props)
  reconcileChildren(fiber, children)
}
/**
 * Updates a host component's DOM element and reconciles its children.
 * This function handles standard DOM elements like div, span, etc.
 * 
 * @param fiber - A fiber node representing the host component (e.g., a DOM node like div, span, etc.).
 */
const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  reconcileChildren(fiber, fiber.props.children)
}

export { updateFunctionComponent, updateHostComponent }
