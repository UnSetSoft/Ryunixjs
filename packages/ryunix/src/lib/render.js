import { vars } from '../utils/index'

/**
 * The function renders an element into a container using a work-in-progress root.
 * @param element - The element parameter is the component or element that needs to be rendered in the
 * container. It could be a Ryunix component or a DOM element.
 * @param container - The container parameter is the DOM element where the rendered element will be
 * appended to. this parameter is optional if you use createRoot().
 */
const render = (element, container) => {
  vars.wipRoot = {
    dom: vars.containerRoot || container,
    props: {
      children: [element],
    },
    alternate: vars.currentRoot,
  }
  vars.deletions = []
  vars.nextUnitOfWork = vars.wipRoot
}

/**
 * @description The function creates a reference to a DOM element with the specified ID. This will be used to initialize the app.
 * @example Ryunix.init("root") -> <div id="root" />
 * @param root - The parameter "root" is the id of the HTML element that will serve as the container
 * for the root element.
 */
const init = (root) => {
  const rootElement = root || '__ryunix'
  vars.containerRoot = document.getElementById(rootElement)
}

export { render, init }
