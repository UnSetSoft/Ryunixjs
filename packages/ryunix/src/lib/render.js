import { vars } from '../utils/index'
import { commitRoot } from './commits'
import { performUnitOfWork, workLoop } from './workers'

/**
 * Renders an element into the specified container or the default root element.
 */
const render = (element, container) => {
  if (!element || !container) {
    console.error('Invalid element or container provided.')
    return
  }

  vars.wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: vars.currentRoot,
  }

  vars.deletions = []
  vars.nextUnitOfWork = vars.wipRoot
  requestIdleCallback(workLoop)
}

/**
 * Initializes the app with a root container.
 */
const init = (rootId = '__ryunix') => {
  const rootElement = document.getElementById(rootId)
  if (!rootElement) {
    console.error(`Root element with ID '${rootId}' not found.`)
    return null
  }

  vars.containerRoot = rootElement
  console.log(`Ryunix initialized with root ID: ${rootId}`)
  return this
}

export { render, init }
