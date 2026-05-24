/**
 * Portal type marker.
 * @type {symbol}
 */
const RYUNIX_PORTAL = Symbol.for('ryunix.portal')

/**
 * createPortal - Renders children into a different DOM container,
 * outside the normal parent hierarchy (modals, tooltips, dropdowns).
 *
 * @param {import('./createElement.js').RyunixNode} children - Element(s) to render
 * @param {Element | DocumentFragment} container - DOM container to render into
 * @returns {import('./createElement.js').RyunixPortalElement | null}
 */
const createPortal = (children, container) => {
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

export { createPortal, RYUNIX_PORTAL }
