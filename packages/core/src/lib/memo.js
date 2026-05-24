/**
 * memo - Memoize component to prevent unnecessary re-renders.
 *
 * @param {import('./createElement.js').RyunixComponent} Component
 * @param {(prev: Record<string, unknown>, next: Record<string, unknown>) => boolean} [arePropsEqual]
 * @returns {import('./createElement.js').RyunixComponent}
 */
const memo = (Component, arePropsEqual = shallowEqual) => {
  /** @param {Record<string, unknown>} props */
  const MemoizedComponent = (props) => {
    return Component(props)
  }
  MemoizedComponent._isMemo = true
  MemoizedComponent._wrappedComponent = Component
  MemoizedComponent._arePropsEqual = arePropsEqual
  const named = /** @type {{ displayName?: string; name?: string }} */ (Component)
  MemoizedComponent.displayName = `Memo(${named.displayName || named.name || 'Component'})`
  return MemoizedComponent
}

/**
 * Shallow props comparison for `memo`.
 * @param {Record<string, unknown>} prevProps
 * @param {Record<string, unknown>} nextProps
 * @returns {boolean}
 */
const shallowEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)

  if (prevKeys.length !== nextKeys.length) return false

  return prevKeys.every((key) => Object.is(prevProps[key], nextProps[key]))
}

/**
 * Deep comparison for complex objects.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
const deepEqual = (a, b) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) =>
    deepEqual(
      /** @type {Record<string, unknown>} */ (a)[key],
      /** @type {Record<string, unknown>} */ (b)[key],
    ),
  )
}

export { memo, shallowEqual, deepEqual }
