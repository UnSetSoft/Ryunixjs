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

  while (vars.nextUnitOfWork && !shouldYield) {
    vars.nextUnitOfWork = performUnitOfWork(vars.nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!vars.nextUnitOfWork && vars.wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

// Start the work loop for the first time
requestIdleCallback(workLoop)

/**
 * Processes a unit of work in the fiber tree.
 * Decides whether to update a function component or a host component (DOM element).
 * @param {Object} fiber - The current fiber representing a component and its state in the virtual DOM tree.
 * @returns {null} The next fiber to process, or undefined if there are no more.
 */
const performUnitOfWork = (fiber) => {
  const isFunctionComponent = fiber.type instanceof Function
  isFunctionComponent ? updateFunctionComponent(fiber) : updateHostComponent(fiber)

  if (fiber.child) return fiber.child
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.parent
  }
  return null
}

export { performUnitOfWork, workLoop }
