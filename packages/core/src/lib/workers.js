import { commitRoot } from './commits'
import { updateFunctionComponent, updateHostComponent } from './components'
import { getState, rIC } from '../utils/index'
import { getCurrentPriority, Priority } from './priority'
import { profiler } from './profiler'

let isWorkLoopScheduled = false

const workLoop = (deadline) => {
  const state = getState()
  let shouldYield = false

  while (state.nextUnitOfWork && !shouldYield) {
    state.nextUnitOfWork = performUnitOfWork(state.nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!state.nextUnitOfWork && state.wipRoot) {
    commitRoot()
  }

  if (state.nextUnitOfWork) {
    rIC(workLoop)
  } else {
    isWorkLoopScheduled = false
  }
}

const performUnitOfWork = (fiber) => {
  const componentName = fiber.type?.name || fiber.type?.displayName || 'Unknown'

  profiler.startMeasure(componentName)

  try {
    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent) {
      updateFunctionComponent(fiber)
    } else {
      updateHostComponent(fiber)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[Ryunix Error Boundary] Error in component "${componentName}":`, error)
    }

    // Walk up the fiber tree to find an error boundary
    let errorFiber = fiber.parent
    let handled = false
    while (errorFiber) {
      // Check if this fiber's type has an onError handler (error boundary)
      if (errorFiber.type?.onError && typeof errorFiber.type.onError === 'function') {
        try {
          errorFiber.type.onError(error, { componentName, fiber })
          handled = true
          break
        } catch (boundaryError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Ryunix Error Boundary] Error in error boundary itself:', boundaryError)
          }
        }
      }
      errorFiber = errorFiber.parent
    }

    if (!handled && process.env.NODE_ENV !== 'production') {
      console.error('[Ryunix] Unhandled component error. Consider adding an error boundary.', error)
    }
  }

  const duration = profiler.endMeasure(componentName)
  if (duration) profiler.recordRender(componentName, duration)

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

const scheduleWork = (root, priority = Priority.NORMAL) => {
  const state = getState()
  state.nextUnitOfWork = root
  state.wipRoot = root
  state.deletions = []
  state.hookIndex = 0
  state.effects = []

  // Start work loop if not already running
  if (!isWorkLoopScheduled) {
    isWorkLoopScheduled = true
    // Higher priority = faster scheduling
    if (priority <= Priority.USER_BLOCKING) {
      rIC(workLoop)
    } else {
      setTimeout(() => rIC(workLoop), 0)
    }
  }
}

export { performUnitOfWork, workLoop, scheduleWork }
