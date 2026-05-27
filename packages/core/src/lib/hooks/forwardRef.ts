import type { RyunixComponent, RyunixNode } from '../../types/internal.js'

type ForwardRefRender = (
  props: Record<string, unknown>,
  ref: unknown,
) => RyunixNode

interface ForwardRefComponent extends RyunixComponent {
  _isForwardRef: true
  _render: ForwardRefRender
}

export function forwardRef(render: ForwardRefRender): ForwardRefComponent {
  if (typeof render !== 'function') {
    throw new Error('forwardRef requires a render function')
  }

  const ForwardRefComponent = ((
    props: Record<string, unknown> & { ref?: unknown },
  ) => {
    const { ref, ...restProps } = props || {}
    return render(restProps, ref ?? null)
  }) as ForwardRefComponent

  const named = render as { displayName?: string; name?: string }
  ForwardRefComponent.displayName = `ForwardRef(${named.displayName || named.name || 'Component'})`
  ForwardRefComponent._isForwardRef = true
  ForwardRefComponent._render = render

  return ForwardRefComponent
}
