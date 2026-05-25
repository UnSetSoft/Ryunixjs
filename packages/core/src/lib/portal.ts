import type { RyunixNode } from '../types/internal.js'

export const RYUNIX_PORTAL = Symbol.for('ryunix.portal')

export interface RyunixPortalElement {
  type: typeof RYUNIX_PORTAL
  props: { children: RyunixNode[] }
  containerInfo: Element | DocumentFragment
  _isPortal: true
}

export function createPortal(
  children: RyunixNode | RyunixNode[],
  container: Element | DocumentFragment,
): RyunixPortalElement | null {
  if (!container) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('createPortal: target container is not a DOM element.')
    }
    return null
  }

  return {
    type: RYUNIX_PORTAL,
    props: {
      children: Array.isArray(children) ? children : [children],
    },
    containerInfo: container,
    _isPortal: true,
  }
}
