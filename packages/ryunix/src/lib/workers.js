import { commitRoot } from './commits'
import { updateFunctionComponent, updateHostComponent } from './components'
import { getState } from '../utils/index'

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
}

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