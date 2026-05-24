import { createElement } from './createElement.js'

/**
 * Wraps content rendered exclusively on the server. During hydration Ryunix
 * preserves the server HTML inside this boundary.
 *
 * @param {object} props
 * @param {import('./createElement.js').RyunixNode} [props.children]
 * @param {string} [props.id]
 * @returns {import('./createElement.js').RyunixElement}
 */
export function ServerBoundary({ children, id }) {
  return createElement(
    'div',
    { 'data-ryunix-server': id, style: { display: 'contents' } },
    children,
  )
}

ServerBoundary.ryunix_type = 'RYUNIX_SERVER_BOUNDARY'
