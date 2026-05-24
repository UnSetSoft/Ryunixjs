/**
 * forwardRef - Allows parent components to pass a ref to a child component.
 *
 * @param {(props: Record<string, unknown>, ref: unknown) => import('./createElement.js').RyunixNode} render
 * @returns {import('./createElement.js').RyunixComponent}
 */
const forwardRef = (render) => {
  if (typeof render !== 'function') {
    throw new Error('forwardRef requires a render function')
  }

  /** @param {Record<string, unknown> & { ref?: unknown }} props */
  const ForwardRefComponent = (props) => {
    const { ref, ...restProps } = props || {}
    return render(restProps, ref || null)
  }

  const named = /** @type {{ displayName?: string; name?: string }} */ (render)
  ForwardRefComponent.displayName = `ForwardRef(${named.displayName || named.name || 'Component'})`
  ForwardRefComponent._isForwardRef = true
  ForwardRefComponent._render = render

  return ForwardRefComponent
}

export { forwardRef }
