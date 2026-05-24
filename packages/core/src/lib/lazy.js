import { RYUNIX_TYPES, getState } from '../utils/index.js'
import { createElement, Fragment } from './createElement.js'
import { useStore, useEffect } from './hooks.js'

/**
 * Suspense status tracking
 */
const SUSPENSE_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
}

/**
 * Lazy load component with real Suspense integration.
 * The loaded module is cached so subsequent renders are synchronous.
 *
 * @param {Function} importFn - Function returning a dynamic import() promise
 * @returns {Function} A Ryunix component
 */
const lazy = (importFn) => {
  let status = SUSPENSE_STATUS.PENDING
  let Component = null
  let error = null
  let promise = null

  const LazyComponent = (props) => {
    // If already resolved, render synchronously
    if (status === SUSPENSE_STATUS.RESOLVED && Component) {
      return createElement(Component, props)
    }

    // If already errored, throw to nearest error boundary
    if (status === SUSPENSE_STATUS.REJECTED && error) {
      throw error
    }

    // Start loading if not already
    if (!promise) {
      promise = importFn()
        .then((module) => {
          Component = module.default || module
          status = SUSPENSE_STATUS.RESOLVED
        })
        .catch((err) => {
          error = err
          status = SUSPENSE_STATUS.REJECTED
        })
    }

    // Use useStore + useEffect to re-render when loading completes
    const [, forceUpdate] = useStore(0)

    useEffect(() => {
      if (status === SUSPENSE_STATUS.PENDING && promise) {
        let active = true
        promise
          .then(() => {
            if (active) forceUpdate((x) => x + 1)
          })
          .catch(() => {
            if (active) forceUpdate((x) => x + 1)
          })
        return () => {
          active = false
        }
      }
    }, [])

    // While pending, return null — Suspense will show fallback
    return null
  }

  // Mark as lazy for Suspense detection
  LazyComponent._isLazy = true
  LazyComponent._getStatus = () => status

  return LazyComponent
}

/**
 * Suspense component — shows a fallback while lazy children are loading.
 *
 * @param {Object} props
 * @param {*} props.fallback - Element to show while loading
 * @param {*} props.children - Lazy component(s)
 * @returns {*} Rendered element
 */
const Suspense = ({ fallback, children }) => {
  const [isLoaded, setIsLoaded] = useStore(false)

  // Check if any child is a lazy component still pending
  const childArray = Array.isArray(children) ? children : [children]
  let anyPending = false

  for (const child of childArray) {
    if (child && child.type && child.type._isLazy) {
      const status = child.type._getStatus()
      if (status === SUSPENSE_STATUS.PENDING) {
        anyPending = true
      }
    }
  }

  useEffect(() => {
    if (!anyPending && !isLoaded) {
      setIsLoaded(true)
    }
  }, [anyPending])

  // Show fallback while any child is pending
  // On server background task, we want to render ACTUAL children to capture them
  if (anyPending && !getState().isSuspenseBackground) {
    return fallback || null
  }

  return createElement(Fragment, { children })
}

Suspense.type = RYUNIX_TYPES.RYUNIX_SUSPENSE

/**
 * Preload component for prefetching — starts the import immediately
 * so it's cached when later rendered.
 *
 * @param {Function} importFn - Dynamic import function
 * @returns {Promise} The import promise
 */
const preload = (importFn) => {
  return importFn()
}

export { lazy, Suspense, preload, SUSPENSE_STATUS }
