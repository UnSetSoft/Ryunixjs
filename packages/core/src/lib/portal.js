/**
 * Portal type marker
 */
const RYUNIX_PORTAL = Symbol.for('ryunix.portal')

/**
 * createPortal - Renders children into a different DOM container,
 * outside the normal parent hierarchy (e.g., for modals, tooltips, dropdowns).
 *
 * Usage:
 *   const Modal = ({ children }) => {
 *     return createPortal(
 *       createElement('div', { className: 'modal' }, children),
 *       document.getElementById('modal-root')
 *     )
 *   }
 *
 * @param {Object} children - Element(s) to render
 * @param {HTMLElement} container - DOM container to render into
 * @returns {Object} Portal element
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
