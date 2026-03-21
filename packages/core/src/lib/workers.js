import { commitRoot } from './commits.js'
import { updateFunctionComponent, updateHostComponent } from './components.js'
import { getState, rIC, nextValidSibling } from '../utils/index.js'
import { getCurrentPriority, Priority } from './priority.js'
import { profiler } from './profiler.js'
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
        // Attempt to attach original JSX source map for DevOverlay lookup
        const src = fiber.props && fiber.props.__source;
        if (src && error && typeof error === 'object') {
          error.__ryunix_source = src;
        }
        
        let targetFiber = fiber;
        while (!error.__ryunix_source && targetFiber) {
           if (targetFiber.props && targetFiber.props.__source) {
             error.__ryunix_source = targetFiber.props.__source;
           }
           targetFiber = targetFiber.parent;
        }
      } catch(e) {}
    }

    // Traverse upwards to find nearest ErrorBoundary
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
      // Assign the error state to the boundary so it can render the fallback
      boundaryFiber.stateError = error
      // Discard the corrupted children of the crashing fiber to prevent undefined behavior
      fiber.child = null

      // Rewind the rendering context to the ErrorBoundary fiber
      // so the work loop immediately starts re-evaluating the boundary branch
      return boundaryFiber
    } else {
      // Uncaught fatal error: stop the work loop entirely
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
    // If we just finished a Host node during hydration, 
    // the next fiber (sibling) should start at the next DOM sibling.
    if (state.isHydrating && nextFiber.dom) {
      state.hydrateCursor = nextValidSibling(nextFiber.dom.nextSibling)
    }

    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
    // When ascending, we don't need to do anything else,
    // the loop will handle the parent's sibling or end.
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

      // Restore specific hydration state for this root
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

    // Set immediate hydration state
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
      // High priority: run as soon as possible in a micro-task
      // We provide a synthetic deadline that allows some work before yielding
      Promise.resolve().then(() => {
        workLoop({ timeRemaining: () => 10, didTimeout: true })
      })
    } else {
      // Low priority: wait for browser idleness
      rIC(workLoop)
    }
  }
}


setScheduleWork(scheduleWork)

export { performUnitOfWork, workLoop, scheduleWork }
