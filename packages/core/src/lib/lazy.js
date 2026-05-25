import { RYUNIX_TYPES, getState } from '../utils/index.js'
import { createElement, Fragment } from './createElement.js'
import { useStore, useEffect } from './hooks.js'
export const SUSPENSE_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
}
function isLazyElement(child) {
  return (
    child != null &&
    typeof child === 'object' &&
    'type' in child &&
    typeof child.type === 'function' &&
    Boolean(child.type._isLazy)
  )
}
export function lazy(importFn) {
  let status = SUSPENSE_STATUS.PENDING
  let Component = null
  let error = null
  let promise = null
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
          const resolved = module
          Component =
            'default' in resolved && resolved.default
              ? resolved.default
              : resolved
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
              forceUpdate((x) => x + 1)
            }
          })
          .catch(() => {
            if (active) {
              forceUpdate((x) => x + 1)
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
  return LazyComponent
}
export const Suspense = ({ fallback, children }) => {
  const [isLoaded, setIsLoaded] = useStore(false)
  const childArray = Array.isArray(children) ? children : [children]
  let anyPending = false
  for (const child of childArray) {
    if (isLazyElement(child)) {
      const lazyStatus = child.type._getStatus?.()
      if (lazyStatus === SUSPENSE_STATUS.PENDING) {
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
export function preload(importFn) {
  return importFn()
}
