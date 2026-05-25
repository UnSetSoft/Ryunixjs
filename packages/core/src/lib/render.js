import { clearContainer } from './dom.js'
import { getState } from '../utils/index.js'
import { scheduleWork } from './workers.js'
const render = (element, container) => {
  const state = getState()
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
  state.isHydrating = false
  state.hydrationFailed = false
  const hasChildNodes =
    state.containerRoot && state.containerRoot.hasChildNodes()
  if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
    console.log(
      `[Ryunix Debug] init: hasChildNodes=${hasChildNodes}, has SSR content detected.`,
    )
  }
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
