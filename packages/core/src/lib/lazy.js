import { RYUNIX_TYPES, getState } from '../utils/index.js'
import { createElement, Fragment } from './createElement.js'
import { useStore, useEffect } from './hooks.js'

/** @typedef {import('../types/internal.js').RyunixComponent} RyunixComponent */

const SUSPENSE_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
}

/**
 * @param {() => Promise<{ default?: RyunixComponent } | RyunixComponent>} importFn
 * @returns {RyunixComponent}
 */
const lazy = (importFn) => {
  let status = SUSPENSE_STATUS.PENDING
  /** @type {Function} */
  let Component = null
  /** @type {unknown} */
  let error = null
  /** @type {Promise<void> | null} */
  let promise = null

  /** @param {Record<string, unknown>} props */
  const LazyComponent = (props) => {
    if (status === SUSPENSE_STATUS.RESOLVED && Component) {
      return createElement(Component, props)
    }

    if (status === SUSPENSE_STATUS.REJECTED && error) {
      throw error
    }

    if (!promise) {
      promise = importFn()
        .then((module) => {
          const resolved =
            /** @type {{ default?: RyunixComponent } | RyunixComponent} */ (module)
          Component = /** @type {Function} */ (
            'default' in resolved && resolved.default
              ? resolved.default
              : resolved
          )
          status = SUSPENSE_STATUS.RESOLVED
        })
        .catch((err) => {
          error = err
          status = SUSPENSE_STATUS.REJECTED
        })
    }

    const [, forceUpdate] = useStore(0)

    useEffect(() => {
      if (status === SUSPENSE_STATUS.PENDING && promise) {
        let active = true
        promise
          .then(() => {
            if (active) {
              /** @type {(prev: number) => number} */
              const bump = (x) => x + 1
              forceUpdate(bump)
            }
          })
          .catch(() => {
            if (active) {
              /** @type {(prev: number) => number} */
              const bump = (x) => x + 1
              forceUpdate(bump)
            }
          })
        return () => {
          active = false
        }
      }
    }, [])

    return null
  }

  LazyComponent._isLazy = true
  LazyComponent._getStatus = () => status

  return /** @type {RyunixComponent} */ (LazyComponent)
}

/**
 * @param {{ fallback?: import('./createElement.js').RyunixNode; children?: import('./createElement.js').RyunixNode }} props
 */
const Suspense = ({ fallback, children }) => {
  const [isLoaded, setIsLoaded] = useStore(false)

  const childArray = Array.isArray(children) ? children : [children]
  let anyPending = false

  for (const child of childArray) {
    if (
      child &&
      typeof child === 'object' &&
      'type' in child &&
      child.type &&
      typeof child.type === 'function' &&
      child.type._isLazy
    ) {
      const status = child.type._getStatus?.()
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

  if (anyPending && !getState().isSuspenseBackground) {
    return fallback || null
  }

  return createElement(Fragment, { children })
}

Suspense.type = RYUNIX_TYPES.RYUNIX_SUSPENSE

/**
 * @param {() => Promise<unknown>} importFn
 */
const preload = (importFn) => {
  return importFn()
}

export { lazy, Suspense, preload, SUSPENSE_STATUS }
