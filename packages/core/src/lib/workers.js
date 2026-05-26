import { commitRoot } from './commits.js'
import { updateFunctionComponent, updateHostComponent } from './components.js'
import { runHydrationRecovery } from './hydrationRecover.js'
import { getState, rIC, nextValidSibling } from '../utils/index.js'
import { getCurrentPriority, Priority } from './priority.js'
import { setScheduleWork } from './bridge.js'
let workQueue = []
let isWorkLoopScheduled = false
function performUnitOfWork(fiber) {
  const state = getState()
  const isFunctionComponent =
    fiber.type instanceof Function || typeof fiber.type === 'function'
  try {
    if (isFunctionComponent) {
      updateFunctionComponent(fiber)
    } else {
      updateHostComponent(fiber)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Ryunix ErrorBoundary] Caught error during render:', error)
      try {
        const src = fiber.props && fiber.props.__source
        if (src && error && typeof error === 'object') {
          error.__ryunix_source = src
        }
        let targetFiber = fiber
        while (!error.__ryunix_source && targetFiber) {
          if (targetFiber.props && targetFiber.props.__source) {
            error.__ryunix_source = targetFiber.props.__source
          }
          targetFiber = targetFiber.parent
        }
      } catch (e) {}
    }
    let boundaryFiber = fiber.parent
    let foundBoundary = false
    while (boundaryFiber) {
      if (
        boundaryFiber.type &&
        boundaryFiber.type.ryunix_type === 'RYUNIX_ERROR_BOUNDARY'
      ) {
        foundBoundary = true
        break
      }
      boundaryFiber = boundaryFiber.parent
    }
    if (foundBoundary) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[Ryunix ErrorBoundary] Recovering tree at nearest boundary.',
        )
      }
      boundaryFiber.stateError = error
      fiber.child = null
      return boundaryFiber
    } else {
      console.error(
        '[Ryunix] Fatal Uncaught Error. No ErrorBoundary was found in the tree to handle this exception:\n',
        error,
      )
      state.nextUnitOfWork = null
      return null
    }
  }
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (state.isHydrating && nextFiber.dom) {
      state.hydrateCursor = nextValidSibling(nextFiber.dom.nextSibling)
    }
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
const workLoop = (deadline) => {
  const state = getState()
  let shouldYield = false
  while ((state.nextUnitOfWork || workQueue.length > 0) && !shouldYield) {
    if (!state.nextUnitOfWork && workQueue.length > 0) {
      const nextRoot = workQueue.shift()
      state.wipRoot = nextRoot
      state.nextUnitOfWork = nextRoot
      state.deletions = []
      if (nextRoot.isHydrating !== undefined) {
        state.isHydrating = nextRoot.isHydrating
        state.hydrateCursor = nextRoot.hydrateCursor
      }
    }
    if (state.nextUnitOfWork) {
      state.nextUnitOfWork = performUnitOfWork(state.nextUnitOfWork)
    }
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!state.nextUnitOfWork && state.wipRoot) {
    commitRoot()
    runHydrationRecovery()
  }
  if (state.nextUnitOfWork || workQueue.length > 0) {
    rIC(workLoop)
  } else {
    isWorkLoopScheduled = false
  }
}
const scheduleWork = (root, priority = getCurrentPriority()) => {
  const state = getState()
  if (state.wipRoot) {
    workQueue.push(root)
  } else {
    state.nextUnitOfWork = root
    state.wipRoot = root
    state.deletions = []
    if (root.isHydrating !== undefined) {
      state.isHydrating = root.isHydrating
      state.hydrateCursor = root.hydrateCursor
    }
  }
  state.hookIndex = 0
  state.effects = []
  if (!isWorkLoopScheduled) {
    isWorkLoopScheduled = true
    if (priority <= Priority.USER_BLOCKING) {
      Promise.resolve().then(() => {
        workLoop({ timeRemaining: () => 10, didTimeout: true })
      })
    } else {
      rIC(workLoop)
    }
  }
}
setScheduleWork(scheduleWork)
export { performUnitOfWork, workLoop, scheduleWork }
