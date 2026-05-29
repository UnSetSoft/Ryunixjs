import { createDom } from './dom.js'
import { reconcileChildren } from './reconciler.js'
import {
  getState,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  nextValidSibling,
} from '../../utils/index.js'
import {
  logHydrationBoundaryMismatch,
  logHydrationFatal,
  logHydrationMismatch,
  logHydrationRecoverable,
} from '../hydration/log.js'
import {
  enqueueScopedRecovery,
  findNearestHydrationBoundary,
  findBoundaryDomFromNode,
  getBoundaryDom,
  getHydrationPolicy,
  skipHydrationSubtree,
} from '../hydration/policy.js'
import type {
  RyunixComponent,
  RyunixFiber,
  RyunixNode,
} from '../../types/internal.js'

type MemoComponent = RyunixComponent & {
  _isMemo?: boolean
  _arePropsEqual?: (
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
  ) => boolean
}

const updateFunctionComponent = (fiber: RyunixFiber) => {
  const state = getState()
  state.wipFiber = fiber
  state.hookIndex = 0
  fiber.hooks = []

  const componentType = fiber.type as MemoComponent & { ryunix_type?: string }
  if (
    state.hydrationRecover &&
    componentType.ryunix_type === 'RYUNIX_ERROR_BOUNDARY'
  ) {
    fiber.stateError = undefined
  }

  if (state.isHydrating) {
    fiber.effectTag = EFFECT_TAGS.HYDRATE
  }

  if (componentType._isMemo && fiber.alternate) {
    const { children: _pc, ...prevRest } = fiber.alternate.props || {}
    const { children: _nc, ...nextRest } = fiber.props || {}
    if (componentType._arePropsEqual?.(prevRest, nextRest)) {
      fiber.hooks = fiber.alternate.hooks
      const oldChild = fiber.alternate.child
      if (oldChild) {
        oldChild.parent = fiber
        fiber.child = oldChild
      }
      return
    }
  }

  const children = [
    (componentType as (props?: Record<string, unknown>) => RyunixNode)(
      fiber.props,
    ),
  ]

  if (componentType._contextId && fiber.props?.value !== undefined) {
    fiber._contextId = componentType._contextId
    fiber._contextValue = fiber.props.value
  }

  reconcileChildren(fiber, children)
}

const isUnderClientOnlyBoundary = (
  fiber: RyunixFiber | null | undefined,
): boolean => {
  let current = fiber?.parent || null
  while (current) {
    if (current._hydrateClientOnly) return true
    current = current.parent || null
  }
  return false
}

const isUnderServerPreserveBoundary = (
  fiber: RyunixFiber | null | undefined,
): boolean => {
  let current = fiber?.parent || null
  while (current) {
    if (current._hydratePreserveServer) return true
    current = current.parent || null
  }
  return false
}

const normalizeChildNodes = (
  children: RyunixNode | RyunixNode[] | undefined,
): RyunixNode[] => {
  if (children == null) return []
  return Array.isArray(children) ? children : [children]
}

const updateHostComponent = (fiber: RyunixFiber) => {
  const state = getState()

  if (fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    fiber._contextId = fiber.props?._contextId as string | symbol | undefined
    fiber._contextValue = fiber.props?.value
  }

  const isPassthrough =
    fiber.type === RYUNIX_TYPES.RYUNIX_FRAGMENT ||
    fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT ||
    fiber.type === Symbol.for('ryunix.portal')

  if (state.isHydrating && isPassthrough) {
    fiber.effectTag = EFFECT_TAGS.HYDRATE
  } else if (state.isHydrating && isUnderServerPreserveBoundary(fiber)) {
    return
  } else if (state.isHydrating && isUnderClientOnlyBoundary(fiber)) {
    if (!fiber.dom) {
      fiber.dom = createDom(fiber)
      fiber.effectTag = EFFECT_TAGS.PLACEMENT
    }
  } else if (!fiber.dom) {
    if (state.isHydrating && state.hydrateCursor) {
      const domNode = state.hydrateCursor
      const isText =
        fiber.type === RYUNIX_TYPES.TEXT_ELEMENT && domNode.nodeType === 3
      const isElement =
        typeof fiber.type === 'string' &&
        domNode.nodeType === 1 &&
        (domNode as Element).tagName.toLowerCase() === fiber.type.toLowerCase()

      if (isText || isElement) {
        fiber.dom = domNode as HTMLElement | Text
        fiber.effectTag = EFFECT_TAGS.HYDRATE

        if (
          isText &&
          fiber.props?.nodeValue != null &&
          domNode.nodeValue !== String(fiber.props.nodeValue)
        ) {
          domNode.nodeValue = String(fiber.props.nodeValue)
          logHydrationRecoverable('text')
        }

        if (
          isElement &&
          (domNode as Element).hasAttribute('data-ryunix-server')
        ) {
          fiber._hydratePreserveServer = true
          state.hydrateCursor = nextValidSibling(domNode)
          reconcileChildren(fiber, [])
          return
        }

        if (
          isElement &&
          (domNode as Element).hasAttribute('data-ryunix-hydrate-boundary')
        ) {
          fiber._hydrateClientOnly = true
        }

        state.hydrateCursor = nextValidSibling(domNode.firstChild)
      } else {
        const policy = getHydrationPolicy()
        const detail = `Mismatch at ${getTypeLabel(fiber.type ?? 'unknown')}. Expected ${
          domNode.nodeType === 1 ? (domNode as Element).tagName : 'text'
        } but got ${String(fiber.type)}.`
        const boundaryFiber = findNearestHydrationBoundary(fiber)
        const boundaryDom =
          (boundaryFiber ? getBoundaryDom(boundaryFiber) : null) ??
          findBoundaryDomFromNode(state.hydrateCursor)

        if (policy.recover === 'boundary' && boundaryFiber && boundaryDom) {
          logHydrationBoundaryMismatch(detail)
          enqueueScopedRecovery(
            boundaryFiber,
            boundaryDom,
            state.hydrateCursor ?? null,
          )
          state.hydrateCursor = skipHydrationSubtree(
            state.hydrateCursor ?? null,
            boundaryDom,
          )
          fiber.dom = createDom(fiber)
          fiber.effectTag = EFFECT_TAGS.PLACEMENT
        } else if (policy.recover === 'none') {
          logHydrationFatal(detail)
          state.isHydrating = false
          state.hydrateCursor = null
          fiber.dom = createDom(fiber)
          fiber.effectTag = EFFECT_TAGS.PLACEMENT
        } else {
          logHydrationMismatch(detail)
          state.isHydrating = false
          state.hydrationFailed = true
          state.hydrateCursor = null
          fiber.dom = createDom(fiber)
          fiber.effectTag = EFFECT_TAGS.PLACEMENT
        }
      }
    } else {
      fiber.dom = createDom(fiber)
    }
  }

  if (fiber._hydratePreserveServer) {
    return
  }

  const children = normalizeChildNodes(fiber.props?.children)
  reconcileChildren(fiber, children)
}

const getTypeLabel = (
  type: string | symbol | RyunixComponent | object,
): string => {
  if (typeof type === 'symbol') return type.description || type.toString()
  if (typeof type === 'function') return type.name || 'anonymous'
  return String(type)
}

export { updateFunctionComponent, updateHostComponent }
