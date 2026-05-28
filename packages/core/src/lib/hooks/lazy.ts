import { RYUNIX_TYPES, getState } from '../../utils/index.js'
import { createElement, Fragment } from '../reconciler/createElement.js'
import { useStore, useEffect } from './hooks.js'
import type {
  RyunixComponent,
  RyunixElement,
  RyunixNode,
} from '../../types/internal.js'

export const SUSPENSE_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const

type SuspenseStatus = (typeof SUSPENSE_STATUS)[keyof typeof SUSPENSE_STATUS]

type LazyModule = { default?: RyunixComponent } | RyunixComponent

interface LazyComponent extends RyunixComponent {
  _isLazy: true
  _getStatus: () => SuspenseStatus
}

interface SuspenseComponent extends RyunixComponent {
  type: symbol
}

function isLazyElement(child: RyunixNode): child is RyunixElement & {
  type: LazyComponent
} {
  return (
    child != null &&
    typeof child === 'object' &&
    'type' in child &&
    typeof child.type === 'function' &&
    Boolean((child.type as LazyComponent)._isLazy)
  )
}

export function lazy(importFn: () => Promise<LazyModule>): LazyComponent {
  let status: SuspenseStatus = SUSPENSE_STATUS.PENDING
  let Component: RyunixComponent | null = null
  let error: unknown = null
  let promise: Promise<void> | null = null

  const LazyComponent = ((props: Record<string, unknown>) => {
    if (status === SUSPENSE_STATUS.RESOLVED && Component) {
      return createElement(Component as RyunixComponent, props)
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
              : (resolved as RyunixComponent)
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
              forceUpdate((x: number) => x + 1)
            }
          })
          .catch(() => {
            if (active) {
              forceUpdate((x: number) => x + 1)
            }
          })
        return () => {
          active = false
        }
      }
    }, [])

    return null
  }) as unknown as LazyComponent

  LazyComponent._isLazy = true
  LazyComponent._getStatus = () => status

  return LazyComponent
}

export const Suspense: SuspenseComponent = ({
  fallback,
  children,
}: {
  fallback?: RyunixNode
  children?: RyunixNode
}) => {
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

  return createElement(Fragment, {
    children: children as RyunixNode | RyunixNode[],
  })
}

Suspense.type = RYUNIX_TYPES.RYUNIX_SUSPENSE

export function preload(importFn: () => Promise<unknown>): Promise<unknown> {
  return importFn()
}
