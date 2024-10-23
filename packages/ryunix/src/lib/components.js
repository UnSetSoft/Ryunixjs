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
  // Set up work-in-progress fiber
  vars.wipFiber = fiber
  vars.hookIndex = 0
  vars.wipFiber.hooks = []

  // Render the function component by calling its type (the component function) with the props
  const children = fiber.type(fiber.props)
  
  // Convert the result to an array for easier handling, supporting single child and fragment-like arrays
  const childArr = Array.isArray(children) ? [...children] : [children]

  // Reconcile the children of the fiber
  reconcileChildren(fiber, childArr)
}

/**
 * Updates a host component's DOM element and reconciles its children.
 * This function handles standard DOM elements like div, span, etc.
 * 
 * @param fiber - A fiber node representing the host component (e.g., a DOM node like div, span, etc.).
 */
const updateHostComponent = (fiber) => {
  // Create a DOM node for the fiber if it doesn't already exist
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // Reconcile the children of the host component (DOM node)
  reconcileChildren(fiber, fiber.props.children)
}

export { updateFunctionComponent, updateHostComponent }
