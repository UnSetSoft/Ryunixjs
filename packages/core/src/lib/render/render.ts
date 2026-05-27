import { clearContainer } from '../reconciler/dom.js'
import { getState } from '../../utils/index.js'
import { scheduleWork } from '../reconciler/workers.js'
import { resetHydrationLogFlags } from '../hydration/log.js'
import { getHydrationPolicy } from '../hydration/policy.js'

/**
 * @typedef {import('./createElement.js').RyunixNode} RyunixNode
 * @typedef {import('../../types/internal.js').RyunixRootFiber} RyunixRootFiber
 * @typedef {import('../../types/internal.js').RyunixComponent} RyunixComponent
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
        /** @type {import('../../types/internal.js').RyunixNode} */ element,
      ],
    },
    alternate: state.currentRoot,
    isHydrating: false,
    hydrateCursor: /** @type {ChildNode | null} */ null,
  }

  scheduleWork(root)
  return root
}

const SSR_ROOT_ATTR = 'data-ryunix-ssr-root'

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
        /** @type {import('../../types/internal.js').RyunixNode} */ element,
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
  const container = document.getElementById(root)
  state.containerRoot = container

  if (!container) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Ryunix] init: container #${root} not found.`)
    }
    return undefined
  }

  resetHydrationLogFlags()
  state.hydrationPolicy = getHydrationPolicy()
  state.scopedRecoveryQueue = []
  state.hydrationRecover = false

  // Reset any stale hydration flags
  state.isHydrating = false
  state.hydrationFailed = false

  // HMR / re-init: replace the existing client tree instead of hydrating again.
  if (state.currentRoot) {
    if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
      console.log(
        `[Ryunix Debug] init: existing root detected. Client render on #${root}`,
      )
    }
    return render(MainElement, container)
  }

  const ssrEnabled = process.env.RYUNIX_SSR !== 'false'
  const isSsrPayload =
    ssrEnabled &&
    container.hasAttribute(SSR_ROOT_ATTR) &&
    container.hasChildNodes()

  if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
    console.log(
      `[Ryunix Debug] init: isSsrPayload=${isSsrPayload}, hasChildNodes=${container.hasChildNodes()}`,
    )
  }

  if (isSsrPayload) {
    if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
      console.log(`[Ryunix Debug] init: hydrating SSR markup on #${root}`)
    }
    container.removeAttribute(SSR_ROOT_ATTR)
    return hydrate(MainElement, container)
  }

  if (process.env.NODE_ENV !== 'production' && process.env.RYUNIX_DEBUG) {
    console.log(`[Ryunix Debug] init: client render on #${root}`)
  }
  return render(MainElement, container)
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
} from '../hydration/recover.js'
