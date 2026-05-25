import type { RyunixComponent } from '../types/internal.js'

type PropsEqual = (
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
) => boolean

interface MemoizedComponent extends RyunixComponent {
  _isMemo: true
  _wrappedComponent: RyunixComponent
  _arePropsEqual: PropsEqual
}

export function memo(
  Component: RyunixComponent,
  arePropsEqual: PropsEqual = shallowEqual,
): MemoizedComponent {
  const MemoizedComponent = ((props: Record<string, unknown>) => {
    return Component(props as never)
  }) as MemoizedComponent

  MemoizedComponent._isMemo = true
  MemoizedComponent._wrappedComponent = Component
  MemoizedComponent._arePropsEqual = arePropsEqual
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`

  return MemoizedComponent
}

export function shallowEqual(
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
): boolean {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)

  if (prevKeys.length !== nextKeys.length) return false

  return prevKeys.every((key) => Object.is(prevProps[key], nextProps[key]))
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  )
}
