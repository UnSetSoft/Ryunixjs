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

/**
 * Marks a DOM subtree for scoped hydration recovery. Mismatches inside this
 * boundary can be recovered locally without remounting the full app root.
 *
 * @param {object} props
 * @param {import('./createElement.js').RyunixNode} [props.children]
 * @param {string} [props.id]
 * @returns {import('./createElement.js').RyunixElement}
 */
export function HydrationBoundary({ children, id }) {
  return createElement(
    'div',
    {
      'data-ryunix-hydrate-boundary': id ?? '',
      suppressHydrationWarning: true,
      style: { display: 'contents' },
    },
    children,
  )
}

HydrationBoundary.ryunix_type = 'RYUNIX_HYDRATION_BOUNDARY'
