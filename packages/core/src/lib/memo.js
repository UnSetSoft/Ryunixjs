/**
 * memo - Memoize component to prevent unnecessary re-renders
 * @param {Function} Component - Component to memoize
 * @param {Function} [arePropsEqual] - Custom comparison function (defaults to shallowEqual)
 * @returns {Function} Memoized component
 */
const memo = (Component, arePropsEqual = shallowEqual) => {
  const MemoizedComponent = (props) => {
    return Component(props)
  }
  MemoizedComponent._isMemo = true
  MemoizedComponent._wrappedComponent = Component
  MemoizedComponent._arePropsEqual = arePropsEqual
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`
  return MemoizedComponent
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
