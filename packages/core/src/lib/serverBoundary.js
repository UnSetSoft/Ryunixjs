import { createElement } from './createElement.js'
export function ServerBoundary({ children, id }) {
  return createElement(
    'div',
    { 'data-ryunix-server': id, style: { display: 'contents' } },
    children,
  )
}
ServerBoundary.ryunix_type = 'RYUNIX_SERVER_BOUNDARY'
