import { vars } from '../utils/index'

const clearContainer = (container) => {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

/**
 * Renders an element into a container using a work-in-progress (WIP) root.
 * @function render
 * @param {Object|HTMLElement} element - The element to be rendered in the container. It can be a Ryunix component (custom element) or a standard DOM element.
 * @param {HTMLElement} container - The container where the element will be rendered. This parameter is optional if `createRoot()` is used beforehand to set up the container.
 * @description The function assigns the `container` to a work-in-progress root and sets up properties for reconciliation, including children and the reference to the current root.
 * It also clears any scheduled deletions and establishes the next unit of work for incremental rendering.
 */
const render = (element, container) => {
  vars.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: vars.currentRoot,
  }

  vars.deletions = []
  vars.nextUnitOfWork = vars.wipRoot

  return vars.wipRoot
}

/**
 * Initializes the application by creating a reference to a DOM element with the specified ID and rendering the main component.
 * @function init
 * @param {Object} MainElement - The main component to render, typically the root component of the application.
 * @param {string} [root='__ryunix'] - The ID of the HTML element that serves as the container for the root element. Defaults to `'__ryunix'` if not provided.
 * @example
 * Ryunix.init(App, "__ryunix"); // Initializes and renders the App component into the <div id="__ryunix"></div> element.
 * @description This function retrieves the container element by its ID and invokes the `render` function to render the main component into it.
 */
const init = (MainElement, root = '__ryunix') => {
  vars.containerRoot = document.getElementById(root)

  const renderProcess = render(MainElement, vars.containerRoot)

  return renderProcess
}

export { render, init }
