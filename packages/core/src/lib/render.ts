import { clearContainer } from './dom.js'
import { getState } from '../utils/index.js'
import { scheduleWork } from './workers.js'
import { resetHydrationLogFlags } from './hydrationLog.js'
import { getHydrationPolicy } from './hydration.js'

/**
 * @typedef {import('./createElement.js').RyunixNode} RyunixNode
 * @typedef {import('../types/internal.js').RyunixRootFiber} RyunixRootFiber
 * @typedef {import('../types/internal.js').RyunixComponent} RyunixComponent
 */

/**
 * The `render` function in JavaScript updates the DOM with a new element and schedules work to be done
 * on the element.
 * @param {RyunixNode} element
 * @param {Element | DocumentFragment} container
 * @returns {RyunixRootFiber}
 */
const render = (element, container) => {
  const state = getState()

  // Clear container before CSR render to avoid duplication
  clearContainer(/** @type {HTMLElement} */ container)

  /** @type {RyunixRootFiber} */
  const root = {
    dom: container,
    props: {
      children: [
        /** @type {import('../types/internal.js').RyunixNode} */ element,
      ],
    },
    alternate: state.currentRoot,
    isHydrating: false,
    hydrateCursor: /** @type {ChildNode | null} */ null,
  }

  scheduleWork(root)
  return root
}

/**
 * @param {ChildNode | null} node
 * @returns {ChildNode | null}
 */
const nextValidSibling = (node) => {
  let next = node
  while (
    next &&
    ((next.nodeType === 3 && !next.nodeValue.trim()) ||
      next.nodeType === 8 ||
      (next.nodeType === 1 &&
        /** @type {Element} */ next.hasAttribute('data-ryunix-ssr')))
  ) {
    next = next.nextSibling
  }
  return next
}

/**
 * The `hydrate` function attaches Ryunix to an existing server-rendered DOM tree.
 * Instead of clearing and re-rendering, it walks the existing DOM nodes and
 * attaches event listeners and reconciles state, preserving SSR HTML.
 * @param {RyunixNode} element
 * @param {Element | DocumentFragment} container
 * @returns {RyunixRootFiber}
 */
const hydrate = (element, container) => {
  const state = getState()

  state.containerRoot = container

  /** @type {RyunixRootFiber} */
  const root = {
    dom: container,
    props: {
      children: [
        /** @type {import('../types/internal.js').RyunixNode} */ element,
      ],
    },
    alternate: state.currentRoot,
    isHydrating: true,
    hydrateCursor: nextValidSibling(container.firstChild),
  }

  scheduleWork(root)
  return root
}

/**
 * @param {RyunixNode} MainElement
 * @param {string} [root]
 * @param {Record<string, unknown>} [components]
 * @returns {RyunixRootFiber | undefined}
 */
const init = (MainElement, root = '__ryunix', components = {}) => {
  const state = getState()
  state.containerRoot = document.getElementById(root)

  resetHydrationLogFlags()
  state.hydrationPolicy = getHydrationPolicy()
  state.scopedRecoveryQueue = []
  state.hydrationRecover = false

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

/**
 * @param {RyunixComponent} component
 * @param {Record<string, unknown>} props
 * @param {(error: unknown) => void} [onError]
 * @returns {RyunixNode}
 */
const safeRender = (component, props, onError) => {
  try {
    return /** @type {RyunixNode} */ /** @type {(props: Record<string, unknown>) => RyunixNode} */ component(
      props,
    )
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Component error:', error)
    }
    if (onError) onError(error)
    return null
  }
}

export { init, render, safeRender, hydrate, clearContainer }
export {
  renderSubtree,
  recoverScopedHydrationFailures,
  recoverHydrationFailureIfNeeded,
  runHydrationRecovery,
} from './hydrationRecover.js'
