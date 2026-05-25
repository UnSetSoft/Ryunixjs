import { createElement } from './createElement.js'
import { getState } from '../utils/index.js'
import type { RyunixFiber, RyunixNode } from '../types/internal.js'

interface ErrorBoundaryProps {
  children?: RyunixNode
  fallback?: RyunixNode | ((error: unknown) => RyunixNode)
}

export function ErrorBoundary({
  children,
  fallback,
}: ErrorBoundaryProps): RyunixNode {
  const state = getState()
  const wipFiber = state.wipFiber as RyunixFiber | null | undefined

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

;(ErrorBoundary as { ryunix_type?: string }).ryunix_type =
  'RYUNIX_ERROR_BOUNDARY'
