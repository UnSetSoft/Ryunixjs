import { commitRoot } from './commits'
import { updateFunctionComponent, updateHostComponent } from './components'
import { vars } from '../utils/index'

/**
 * Main work loop that processes the fiber tree using requestIdleCallback.
 * It continues processing until all units of work are completed or the browser needs to yield.
 * @param {IdleDeadline} deadline - Represents the time remaining for the browser to execute tasks before yielding.
 */
const workLoop = (deadline) => {
  let shouldYield = false

  // Process each unit of work until we should yield back control to the browser
  while (vars.nextUnitOfWork && !shouldYield) {
    vars.nextUnitOfWork = performUnitOfWork(vars.nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  // If there are no more units of work, commit the changes to the DOM
  if (!vars.nextUnitOfWork && vars.wipRoot) {
    commitRoot()
  }

  // Continue the work loop using requestIdleCallback for efficient task scheduling
  requestIdleCallback(workLoop)
}

// Start the work loop for the first time
requestIdleCallback(workLoop)

/**
 * Processes a unit of work in the fiber tree.
 * Decides whether to update a function component or a host component (DOM element).
 * @param {Object} fiber - The current fiber representing a component and its state in the virtual DOM tree.
 * @returns {Object|undefined} The next fiber to process, or undefined if there are no more.
 */
const performUnitOfWork = (fiber) => {
  // Determine if the current fiber is a function component
  const isFunctionComponent = fiber.type instanceof Function

  // Update based on the type of component
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // Return the child fiber if it exists (depth-first processing)
  if (fiber.child) {
    return fiber.child
  }

  // Traverse up the tree looking for the next sibling to process
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

  // If no more fibers, return undefined
  return undefined
}

export { performUnitOfWork, workLoop }
