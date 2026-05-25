export const RYUNIX_PORTAL = Symbol.for('ryunix.portal')
export function createPortal(children, container) {
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
