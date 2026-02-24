import { getState } from '../utils/index'
import { scheduleWork } from './workers'

const clearContainer = (container) => {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

/**
 * The `render` function in JavaScript updates the DOM with a new element and schedules work to be done
 * on the element.
 * @param element - The `element` parameter in the `render` function is the element that you want to
 * render in the specified container. It could be a DOM element, a component, or any other valid
 * element that you want to display on the screen.
 * @param container - The `container` parameter in the `render` function is the DOM element where the
 * `element` will be rendered. It is the target container where the element will be appended as a
 * child.
 * @returns The `render` function is returning the `state.wipRoot` object.
 */
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

/**
 * The `init` function initializes a rendering process for a main element within a specified container
 * root element.
 * @param MainElement - MainElement is the main component or element that you want to render on the
 * webpage. It could be a React component, a DOM element, or any other element that you want to display
 * on the page.
 * @param [root=__ryunix] - The `root` parameter in the `init` function is a default parameter with the
 * value `'__ryunix'`. If no value is provided for `root` when calling the `init` function, it will
 * default to `'__ryunix'`.
 * @returns The `renderProcess` function is being returned from the `init` function.
 */
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
