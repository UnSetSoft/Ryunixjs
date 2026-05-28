import { createElement } from '../reconciler/createElement.js'
import type { RyunixElement, RyunixNode } from '../../types/internal.js'

/**
 * Wraps content rendered exclusively on the server. During hydration Ryunix
 * preserves the server HTML inside this boundary.
 */
export function ServerBoundary({
  children,
  id,
}: {
  children?: RyunixNode
  id?: string
}): RyunixElement {
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
 */
export function HydrationBoundary({
  children,
  id,
}: {
  children?: RyunixNode
  id?: string
}): RyunixElement {
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
