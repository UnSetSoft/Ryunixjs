import { createElement } from './createElement.js'
export function ServerBoundary({ children, id }) {
  return createElement(
    'div',
    { 'data-ryunix-server': id, style: { display: 'contents' } },
    children,
  )
}
ServerBoundary.ryunix_type = 'RYUNIX_SERVER_BOUNDARY'
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
