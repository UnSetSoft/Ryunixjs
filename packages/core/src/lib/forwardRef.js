/**
 * forwardRef - Allows parent components to pass a ref to a child component.
 *
 * Usage:
 *   const MyInput = forwardRef((props, ref) => {
 *     return createElement('input', { ...props, ref })
 *   })
 *
 * @param {Function} render - A function component that receives (props, ref)
 * @returns {Function} A component that forwards refs
 */
const forwardRef = (render) => {
  if (typeof render !== 'function') {
    throw new Error('forwardRef requires a render function')
  }

  const ForwardRefComponent = (props) => {
    const { ref, ...restProps } = props || {}
    return render(restProps, ref || null)
  }

  ForwardRefComponent.displayName = `ForwardRef(${render.displayName || render.name || 'Component'})`
  ForwardRefComponent._isForwardRef = true
  ForwardRefComponent._render = render

  return ForwardRefComponent
}

export { forwardRef }
