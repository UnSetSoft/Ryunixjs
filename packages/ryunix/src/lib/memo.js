import { useMemo } from './hooks'

/**
 * memo - Memoize component to prevent unnecessary re-renders
 */
const memo = (Component, arePropsEqual) => {
  return (props) => {
    const memoizedElement = useMemo(() => {
      return Component(props)
    }, [
      // Default comparison: shallow props comparison
      ...Object.values(props),
    ])

    return memoizedElement
  }
}

/**
 * Custom comparison function for memo
 */
const shallowEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)

  if (prevKeys.length !== nextKeys.length) return false

  return prevKeys.every((key) => Object.is(prevProps[key], nextProps[key]))
}

/**
 * Deep comparison for complex objects
 */
const deepEqual = (a, b) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) => deepEqual(a[key], b[key]))
}

export { memo, shallowEqual, deepEqual }
