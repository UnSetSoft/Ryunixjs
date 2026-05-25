export function forwardRef(render) {
  if (typeof render !== 'function') {
    throw new Error('forwardRef requires a render function')
  }
  const ForwardRefComponent = (props) => {
    const { ref, ...restProps } = props || {}
    return render(restProps, ref ?? null)
  }
  const named = render
  ForwardRefComponent.displayName = `ForwardRef(${named.displayName || named.name || 'Component'})`
  ForwardRefComponent._isForwardRef = true
  ForwardRefComponent._render = render
  return ForwardRefComponent
}
