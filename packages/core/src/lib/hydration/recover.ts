import { clearContainer } from '../reconciler/dom.js'
import { getState } from '../../utils/index.js'
import { scheduleWork } from '../reconciler/bridge.js'
import {
  logHydrationBoundaryRecovery,
  logHydrationFailure,
  logHydrationRecovery,
} from './log.js'
import { getHydrationPolicy } from './policy.js'
import type { RyunixNode, RyunixRootFiber } from '../../types/internal.js'

const getRootChild = (
  children: RyunixNode | RyunixNode[] | undefined,
): RyunixNode | undefined => {
  if (children == null) return undefined
  return Array.isArray(children) ? children[0] : children
}

export const renderSubtree = (
  element: RyunixNode,
  container: Element | DocumentFragment,
) => {
  clearContainer(container as HTMLElement)

  const root: RyunixRootFiber = {
    dom: container,
    props: { children: [element] },
    isHydrating: false,
    hydrateCursor: null,
  }

  scheduleWork(root, undefined)
}

export const recoverScopedHydrationFailures = () => {
  const state = getState()
  const queue = state.scopedRecoveryQueue
  if (!queue?.length) return

  state.scopedRecoveryQueue = []
  for (const item of queue) {
    logHydrationBoundaryRecovery()
    renderSubtree(item.element, item.boundaryDom)
  }
}

export const recoverHydrationFailureIfNeeded = () => {
  const state = getState()
  if (!state.hydrationFailed || state.hydrationRecover) return

  const policy = getHydrationPolicy()
  if (policy.recover === 'none') return

  const container = state.containerRoot || state.currentRoot?.dom
  const element = getRootChild(state.currentRoot?.props?.children)
  if (!container || element == null) return

  state.hydrationRecover = true
  state.hydrationFailed = false
  logHydrationFailure('')
  logHydrationRecovery()
  renderSubtree(element as RyunixNode, container)
}

export const runHydrationRecovery = () => {
  const state = getState()
  recoverScopedHydrationFailures()
  recoverHydrationFailureIfNeeded()
  state.hydrationRecover = false
}
