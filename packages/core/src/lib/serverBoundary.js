import { createElement } from './createElement.js'

/**
 * ServerBoundary is a special component used to wrap content that is rendered
 * exclusively on the server. During hydration, Ryunix will skip this node's
 * children, preserving the server-rendered HTML.
 */
export function ServerBoundary({ children, id }) {
  // On the client, this component just renders a container.
  // The children are already in the DOM from the server.
  return createElement(
    'div',
    { 'data-ryunix-server': id, style: { display: 'contents' } },
    children,
  )
}

ServerBoundary.ryunix_type = 'RYUNIX_SERVER_BOUNDARY'
