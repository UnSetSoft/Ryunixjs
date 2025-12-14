import { getState } from '../utils/index'
import { scheduleWork } from './workers'

/**
 * Clear all children from container
 */
const clearContainer = (container) => {
  if (!container) return

  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

/**
 * Render element into container
 */
const render = (element, container) => {
  if (!element || !container) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('render requires both element and container')
    }
    return null
  }

  const state = getState()

  // Create work-in-progress root
  state.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: state.currentRoot,
  }

  state.nextUnitOfWork = state.wipRoot
  state.deletions = []

  // Start work loop
  scheduleWork(state.wipRoot)

  return state.wipRoot
}

/**
 * Initialize Ryunix app
 */
const init = (mainElement, rootId = '__ryunix') => {
  if (!mainElement) {
    throw new Error('init requires a main element to render')
  }

  const state = getState()

  // Get container element
  const container = typeof rootId === 'string'
    ? document.getElementById(rootId)
    : rootId

  if (!container) {
    throw new Error(`Container element with id "${rootId}" not found`)
  }

  state.containerRoot = container

  // Render main element
  return render(mainElement, container)
}

export { render, init, clearContainer }