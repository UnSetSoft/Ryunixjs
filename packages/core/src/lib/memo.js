export function memo(Component, arePropsEqual = shallowEqual) {
  const MemoizedComponent = (props) => {
    return Component(props)
  }
  MemoizedComponent._isMemo = true
  MemoizedComponent._wrappedComponent = Component
  MemoizedComponent._arePropsEqual = arePropsEqual
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`
  return MemoizedComponent
}
export function shallowEqual(prevProps, nextProps) {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)
  if (prevKeys.length !== nextKeys.length) return false
  return prevKeys.every((key) => Object.is(prevProps[key], nextProps[key]))
}
export function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => deepEqual(a[key], b[key]))
}
