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

/**
 * @param {RyunixNode} element
 * @param {Element | DocumentFragment} container
 */
export const renderSubtree = (element, container) => {
  clearContainer(/** @type {HTMLElement} */ container)

  /** @type {RyunixRootFiber} */
  const root = {
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
  const element = state.currentRoot?.props?.children?.[0]
  if (!container || element == null) return

  state.hydrationRecover = true
  state.hydrationFailed = false
  logHydrationFailure('')
  logHydrationRecovery()
  renderSubtree(/** @type {RyunixNode} */ element, container)
}

export const runHydrationRecovery = () => {
  recoverScopedHydrationFailures()
  recoverHydrationFailureIfNeeded()
}
