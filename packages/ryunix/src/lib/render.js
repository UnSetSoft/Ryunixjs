import { getState } from '../utils/index'
import { scheduleWork } from './workers'

const clearContainer = (container) => {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

const render = (element, container) => {
  const state = getState()
  state.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: state.currentRoot,
  }

  state.nextUnitOfWork = state.wipRoot
  state.deletions = []
  scheduleWork(state.wipRoot)
  return state.wipRoot
}

const init = (MainElement, root = '__ryunix') => {
  const state = getState()
  state.containerRoot = document.getElementById(root)
  const renderProcess = render(MainElement, state.containerRoot)
  return renderProcess
}

const safeRender = (component, props, onError) => {
  try {
    return component(props)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Component error:', error)
    }
    if (onError) onError(error)
    return null
  }
}

export { init, render, safeRender }
