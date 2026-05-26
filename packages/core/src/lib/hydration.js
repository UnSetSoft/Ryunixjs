import { getState } from '../utils/index.js'
export const getHydrationPolicy = () => {
  const recoverRaw = process.env.RYUNIX_HYDRATION_RECOVER || 'boundary'
  const boundariesRaw = process.env.RYUNIX_HYDRATION_BOUNDARIES || 'route'
  const strict = process.env.RYUNIX_HYDRATION_STRICT === 'true'
  const recover =
    recoverRaw === 'none' || recoverRaw === 'root' ? recoverRaw : 'boundary'
  const boundaries =
    boundariesRaw === 'server-only' || boundariesRaw === 'all-layouts'
      ? boundariesRaw
      : 'route'
  return {
    recover,
    boundaries,
    strict,
  }
}
export const findNearestHydrationBoundary = (fiber) => {
  let current = fiber || null
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
    const maybeTyped = type
    if (
      type &&
      typeof type === 'function' &&
      (maybeTyped?.ryunix_type === 'RYUNIX_HYDRATION_BOUNDARY' ||
        maybeTyped?.ryunix_type === 'RYUNIX_SERVER_BOUNDARY')
    ) {
      return current
    }
    current = current.parent || null
  }
  return null
}
export const getBoundaryDom = (fiber) => {
  if (!fiber) return null
  if (fiber.dom && fiber.dom.nodeType === 1) {
    const el = fiber.dom
    if (el.hasAttribute('data-ryunix-hydrate-boundary')) return el
  }
  let child = fiber.child || null
  while (child) {
    if (child.dom && child.dom.nodeType === 1) {
      const el = child.dom
      if (el.hasAttribute('data-ryunix-hydrate-boundary')) return el
    }
    child = child.child || child.sibling || null
  }
  return null
}
export const skipHydrationSubtree = (cursor, boundaryRoot) => {
  if (!cursor || !boundaryRoot) return cursor
  if (cursor === boundaryRoot) return boundaryRoot.nextSibling
  if (boundaryRoot.contains(cursor)) return boundaryRoot.nextSibling
  return cursor
}
export const enqueueScopedRecovery = (
  boundaryFiber,
  boundaryDom,
  resumeCursor,
) => {
  if (!boundaryFiber || !boundaryDom) return
  const state = getState()
  const queue = state.scopedRecoveryQueue || []
  queue.push({
    boundaryFiber,
    boundaryDom,
    resumeCursor,
    element: Array.isArray(boundaryFiber.props?.children)
      ? boundaryFiber.props.children[0]
      : boundaryFiber.props?.children,
  })
  state.scopedRecoveryQueue = queue
}
