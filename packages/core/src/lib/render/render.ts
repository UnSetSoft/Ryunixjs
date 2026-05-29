import { clearContainer } from '../reconciler/dom.js'
import { getState } from '../../utils/index.js'
import { scheduleWork } from '../reconciler/workers.js'
import { resetHydrationLogFlags } from '../hydration/log.js'
import { getHydrationPolicy } from '../hydration/policy.js'
import type {
  RyunixComponent,
  RyunixNode,
  RyunixRootFiber,
} from '../../types/internal.js'

/**
 * The `render` function in JavaScript updates the DOM with a new element and schedules work to be done
 * on the element.
 */
const render = (
  element: RyunixNode,
  container: Element | DocumentFragment,
): RyunixRootFiber => {
  const state = getState()

  clearContainer(container as HTMLElement)

  const root: RyunixRootFiber = {
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

const SSR_ROOT_ATTR = 'data-ryunix-ssr-root'

const nextValidSibling = (node: ChildNode | null): ChildNode | null => {
  let next = node
  while (
    next &&
    ((next.nodeType === 3 && !next.nodeValue?.trim()) ||
      next.nodeType === 8 ||
      (next.nodeType === 1 &&
        (next as Element).hasAttribute('data-ryunix-ssr')))
  ) {
    next = next.nextSibling
  }
  return next
}

/**
 * The `hydrate` function attaches Ryunix to an existing server-rendered DOM tree.
 */
const hydrate = (
  element: RyunixNode,
  container: Element | DocumentFragment,
): RyunixRootFiber => {
  const state = getState()

  state.containerRoot = container

  const root: RyunixRootFiber = {
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

const init = (
  MainElement: RyunixNode,
  root = '__ryunix',
  _components: Record<string, unknown> = {},
): RyunixRootFiber | undefined => {
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

  state.isHydrating = false
  state.hydrationFailed = false

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

const safeRender = (
  component: RyunixComponent,
  props: Record<string, unknown>,
  onError?: (error: unknown) => void,
): RyunixNode => {
  try {
    return (component as (props: Record<string, unknown>) => RyunixNode)(props)
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
