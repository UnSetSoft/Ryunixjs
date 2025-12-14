import { commitRoot } from './commits'
import { updateFunctionComponent, updateHostComponent } from './components'
import { getState } from '../utils/index'

/**
 * Work loop - processes units of work during idle time
 */
const workLoop = (deadline) => {
  const state = getState()
  let shouldYield = false

  while (state.nextUnitOfWork && !shouldYield) {
    state.nextUnitOfWork = performUnitOfWork(state.nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  // Commit when work is complete
  if (!state.nextUnitOfWork && state.wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

// Start work loop
requestIdleCallback(workLoop)

/**
 * Perform unit of work for a fiber
 */
const performUnitOfWork = (fiber) => {
  if (!fiber) return null

  try {
  // Update fiber based on type
    const isFunctionComponent = fiber.type instanceof Function

    if (isFunctionComponent) {
      updateFunctionComponent(fiber)
    } else {
      updateHostComponent(fiber)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error performing unit of work:', error, fiber)
    }
  }

  // Return next unit of work
  if (fiber.child) {
    return fiber.child
  }

  // Traverse up to find sibling
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

  return null
}

/**
 * Schedule work to be performed
 */
const scheduleWork = (root) => {
  const state = getState()

  state.nextUnitOfWork = root
  state.wipRoot = root
  state.deletions = []
  state.hookIndex = 0
  state.effects = []

  requestIdleCallback(workLoop)
}

export { performUnitOfWork, workLoop, scheduleWork }