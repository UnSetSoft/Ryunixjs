/**
 * Public API surface of `@unsetsoft/ryunixjs`.
 * Re-exports createElement, hooks, render, SSR helpers, and related utilities.
 *
 * @module lib/index
 */

export {
  createElement,
  Fragment,
  cloneElement,
  isValidElement,
} from './createElement.js'
export { render, init, safeRender, hydrate } from './render.js'
export {
  renderToString,
  renderToReadableStream,
  escapeHtml,
  renderToStringAsync,
} from './server.js'
export * from './hooks.js'
export * as Hooks from './hooks.js'
export { memo, shallowEqual, deepEqual } from './memo.js'
export { lazy, Suspense, preload } from './lazy.js'
export { batchUpdates } from './batching.js'
export { Priority } from './priority.js'
export { profiler, useProfiler, withProfiler } from './profiler.js'
export { forwardRef } from './forwardRef.js'
export { createPortal } from './portal.js'
export { ServerBoundary, HydrationBoundary } from './serverBoundary.js'
export { ErrorBoundary } from './errorBoundary.js'
export {
  logHydrationInfo,
  logHydrationRecoverable,
  logHydrationBoundaryMismatch,
  logHydrationBoundaryRecovery,
  logHydrationFatal,
} from './hydrationLog.js'
export { getState } from '../utils/index.js'
export { createActionProxy } from './serverActions.js'
export { RyunixDevOverlay } from './devOverlay.js'
