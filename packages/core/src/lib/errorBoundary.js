import { createElement } from './createElement.js'
import { getState } from '../utils/index.js'

/**
 * Catches render errors in child components and renders a fallback UI.
 *
 * @param {object} props
 * @param {import('./createElement.js').RyunixNode} [props.children]
 * @param {import('./createElement.js').RyunixNode | ((error: unknown) => import('./createElement.js').RyunixNode)} [props.fallback]
 * @returns {import('./createElement.js').RyunixNode}
 */
export function ErrorBoundary({ children, fallback }) {
  const state = getState()

  if (state.wipFiber && /** @type {{ stateError?: unknown }} */ (state.wipFiber).stateError) {
    const error = /** @type {{ stateError: unknown }} */ (state.wipFiber).stateError
    if (typeof fallback === 'function') {
      return fallback(error)
    }
    return fallback
  }

  return createElement('ryunix-error-boundary-wrapper', { style: { display: 'contents' } }, children)
}

ErrorBoundary.ryunix_type = 'RYUNIX_ERROR_BOUNDARY'
