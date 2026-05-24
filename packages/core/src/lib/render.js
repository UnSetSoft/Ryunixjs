import { clearContainer } from './dom.js'
import { getState } from '../utils/index.js'
import { scheduleWork } from './workers.js'
import { createElement } from './createElement.js'

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

  // Clear container before CSR render to avoid duplication
  clearContainer(container)

  const root = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: state.currentRoot,
    isHydrating: false,
    hydrateCursor: null,
  }

  scheduleWork(root)
  return root
}

const nextValidSibling = (node) => {
  let next = node
  while (
    next &&
    ((next.nodeType === 3 && !next.nodeValue.trim()) ||
      next.nodeType === 8 ||
      (next.nodeType === 1 && next.hasAttribute('data-ryunix-ssr')))
  ) {
    next = next.nextSibling
  }
  return next
}

/**
 * The `hydrate` function attaches Ryunix to an existing server-rendered DOM tree.
 * Instead of clearing and re-rendering, it walks the existing DOM nodes and
 * attaches event listeners and reconciles state, preserving SSR HTML.
 */
const hydrate = (element, container) => {
  const state = getState()

  state.containerRoot = container

  const root = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: state.currentRoot,
    isHydrating: true,
    hydrateCursor: nextValidSibling(container.firstChild),
  }

  scheduleWork(root)
  return root
}

const init = (MainElement, root = '__ryunix', components = {}) => {
  const state = getState()
  state.containerRoot = document.getElementById(root)

  // Reset any stale hydration flags
  state.isHydrating = false
  state.hydrationFailed = false

  // Auto-detect SSR based on child nodes - no need to manually set process.env.RYUNIX_SSR
  const hasChildNodes =
    state.containerRoot && state.containerRoot.hasChildNodes()

  if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
    console.log(
      `[Ryunix Debug] init: hasChildNodes=${hasChildNodes}, has SSR content detected.`,
    )
  }

  // Auto-detect: if there's existing content, try to hydrate (SSR)
  // If explicitly disabled via RYUNIX_SSR=false, skip hydration
  const ssrEnabled = process.env.RYUNIX_SSR !== 'false'
  if (hasChildNodes && ssrEnabled) {
    if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
      console.log(
        `[Ryunix Debug] init: SSR content detected. Starting hydration on #${root}`,
      )
    }
    const res = hydrate(MainElement, state.containerRoot)
    return res
  }

  if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
    console.log(
      `[Ryunix Debug] init: No SSR content or SSR disabled. Starting normal render on #${root}`,
    )
  }
  const res = render(MainElement, state.containerRoot)
  return res
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

export { init, render, safeRender, hydrate, clearContainer }
