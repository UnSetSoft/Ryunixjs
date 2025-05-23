import { commitRoot } from './commits'
import { updateFunctionComponent, updateHostComponent } from './components'
import { vars } from '../utils/index'

/**
 * This function uses requestIdleCallback to perform work on a fiber tree until it is complete or the
 * browser needs to yield to other tasks.
 * @param deadline - The `deadline` parameter is an object that represents the amount of time the
 * browser has to perform work before it needs to handle other tasks. It has a `timeRemaining()` method
 * that returns the amount of time remaining before the deadline is reached. The `shouldYield` variable
 * is used to determine
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

requestIdleCallback(workLoop)

/**
 * The function performs a unit of work by updating either a function component or a host component and
 * returns the next fiber to be processed.
 * @param fiber - A fiber is a unit of work in Ryunix that represents a component and its state. It
 * contains information about the component's type, props, and children, as well as pointers to its
 * parent, child, and sibling fibers. The `performUnitOfWork` function takes a fiber as a parameter and
 * performs work
 * @returns The function `performUnitOfWork` returns the next fiber to be processed. If the current
 * fiber has a child, it returns the child. Otherwise, it looks for the next sibling of the current
 * fiber. If there are no more siblings, it goes up the tree to the parent and looks for the next
 * sibling of the parent. The function returns `undefined` if there are no more fibers to process.
 */
const performUnitOfWork = (fiber) => {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
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
  return undefined
}

const scheduleWork = (root) => {
  vars.nextUnitOfWork = root
  requestIdleCallback(workLoop)
}

export { performUnitOfWork, workLoop, scheduleWork }
