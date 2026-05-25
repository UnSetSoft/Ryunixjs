import { createElement } from './createElement.js'
import { getState } from '../utils/index.js'
export function ErrorBoundary({ children, fallback }) {
  const state = getState()
  const wipFiber = state.wipFiber
  if (wipFiber?.stateError) {
    const error = wipFiber.stateError
    if (typeof fallback === 'function') {
      return fallback(error)
    }
    return fallback ?? null
  }
  return createElement(
    'ryunix-error-boundary-wrapper',
    { style: { display: 'contents' } },
    children,
  )
}
ErrorBoundary.ryunix_type = 'RYUNIX_ERROR_BOUNDARY'
