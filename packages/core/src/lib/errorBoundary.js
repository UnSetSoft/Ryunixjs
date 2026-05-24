import { createElement } from './createElement.js'
import { getState } from '../utils/index.js'

/**
 * ErrorBoundary is a native Ryunix component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 *
 * It hooks directly into the `performUnitOfWork` reconciler loop.
 */
export function ErrorBoundary({ children, fallback }) {
  const state = getState()

  // If the engine caught an error for this boundary, render the fallback
  if (state.wipFiber && state.wipFiber.stateError) {
    if (typeof fallback === 'function') {
      return fallback(state.wipFiber.stateError)
    }
    return fallback
  }

  // Otherwise render children normally
  return createElement(
    'ryunix-error-boundary-wrapper',
    { style: { display: 'contents' } },
    children,
  )
}

ErrorBoundary.ryunix_type = 'RYUNIX_ERROR_BOUNDARY'
