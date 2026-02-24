import { commitRoot } from './commits'
import { updateFunctionComponent, updateHostComponent } from './components'
import { getState } from '../utils/index'
import { getCurrentPriority, Priority } from './priority'
import { profiler } from './profiler'

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

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

const performUnitOfWork = (fiber) => {
  const componentName = fiber.type?.name || fiber.type?.displayName || 'Unknown'

  profiler.startMeasure(componentName)

  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
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

  // Higher priority = faster scheduling
  if (priority <= Priority.USER_BLOCKING) {
    requestIdleCallback(workLoop)
  } else {
    setTimeout(() => requestIdleCallback(workLoop), 0)
  }
}

export { performUnitOfWork, workLoop, scheduleWork }
