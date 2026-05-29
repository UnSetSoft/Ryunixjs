import { getState } from '../../utils/index.js'
import type {
  HydrationPolicy,
  RyunixFiber,
  RyunixNode,
  ScopedRecovery,
} from '../../types/internal.js'

export const getHydrationPolicy = (): HydrationPolicy => {
  const env = (globalThis.process && globalThis.process.env) || {}
  const recoverRaw = env.RYUNIX_HYDRATION_RECOVER || 'boundary'
  const boundariesRaw = env.RYUNIX_HYDRATION_BOUNDARIES || 'route'
  const strict = env.RYUNIX_HYDRATION_STRICT === 'true'
  const recover: HydrationPolicy['recover'] =
    recoverRaw === 'none' || recoverRaw === 'root' ? recoverRaw : 'boundary'
  const boundaries: HydrationPolicy['boundaries'] =
    boundariesRaw === 'server-only' || boundariesRaw === 'all-layouts'
      ? boundariesRaw
      : 'route'
  return {
    recover,
    boundaries,
    strict,
  }
}

/**
 */
export const findNearestHydrationBoundary = (
  fiber: RyunixFiber | null | undefined,
): RyunixFiber | null => {
  let current: RyunixFiber | null = fiber || null
  while (current) {
    const props = current.props
    if (
      props &&
      Object.prototype.hasOwnProperty.call(
        props,
        'data-ryunix-hydrate-boundary',
      )
    ) {
      return current
    }

    const type = current.type
    const maybeTyped = type as { ryunix_type?: string } | undefined
    if (
      type &&
      typeof type === 'function' &&
      maybeTyped?.ryunix_type === 'RYUNIX_HYDRATION_BOUNDARY'
    ) {
      return current
    }
    current = current.parent || null
  }
  return null
}

export const findBoundaryDomFromNode = (
  node: ChildNode | null | undefined,
): Element | null => {
  let current: Node | null = node ?? null
  while (current) {
    if (
      current.nodeType === 1 &&
      (current as Element).hasAttribute('data-ryunix-hydrate-boundary')
    ) {
      return current as Element
    }
    current = current.parentNode
  }
  return null
}

/**
 */
export const getBoundaryDom = (fiber: RyunixFiber | null): Element | null => {
  if (!fiber) return null
  if (fiber.dom && fiber.dom.nodeType === 1) {
    const el = fiber.dom as Element
    if (el.hasAttribute('data-ryunix-hydrate-boundary')) return el
  }

  let child = fiber.child || null
  while (child) {
    if (child.dom && child.dom.nodeType === 1) {
      const el = child.dom as Element
      if (el.hasAttribute('data-ryunix-hydrate-boundary')) return el
    }
    child = child.child || child.sibling || null
  }

  return null
}

/**
 */
export const skipHydrationSubtree = (
  cursor: ChildNode | null,
  boundaryRoot: Element | null,
): ChildNode | null => {
  if (!cursor || !boundaryRoot) return cursor
  if (cursor === boundaryRoot) return boundaryRoot.nextSibling
  if (boundaryRoot.contains(cursor)) return boundaryRoot.nextSibling
  return cursor
}

/**
 */
export const enqueueScopedRecovery = (
  boundaryFiber: RyunixFiber | null,
  boundaryDom: Element | null,
  resumeCursor: ChildNode | null,
) => {
  if (!boundaryFiber || !boundaryDom) return
  const state = getState()
  const queue: ScopedRecovery[] = state.scopedRecoveryQueue || []
  queue.push({
    boundaryFiber,
    boundaryDom,
    resumeCursor,
    element: (Array.isArray(boundaryFiber.props?.children)
      ? boundaryFiber.props.children[0]
      : boundaryFiber.props?.children) as RyunixNode,
  })
  state.scopedRecoveryQueue = queue
}
