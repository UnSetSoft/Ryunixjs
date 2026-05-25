import type { IdleDeadline, RyunixRenderState } from '../types/internal.js'

const rICFallback = (cb: (deadline: IdleDeadline) => void): number =>
  setTimeout(() => cb({ timeRemaining: () => 1 }), 1) as unknown as number

const rIC: (cb: (deadline: IdleDeadline) => void) => number =
  typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : rICFallback

const createRenderState = (): RyunixRenderState => ({
  containerRoot: null,
  nextUnitOfWork: null,
  currentRoot: null,
  wipRoot: null,
  deletions: [],
  wipFiber: null,
  hookIndex: 0,
  effects: [],
})

let globalState: RyunixRenderState = createRenderState()

export const getState = (): RyunixRenderState => globalState

const CAMEL_TO_KEBAB_REGEX = /[A-Z]/g

export const RYUNIX_TYPES = Object.freeze({
  TEXT_ELEMENT: Symbol.for('ryunix.text.element'),
  RYUNIX_ELEMENT: Symbol.for('ryunix.element'),
  RYUNIX_EFFECT: Symbol.for('ryunix.effect'),
  RYUNIX_MEMO: Symbol.for('ryunix.memo'),
  RYUNIX_URL_QUERY: Symbol.for('ryunix.urlQuery'),
  RYUNIX_REF: Symbol.for('ryunix.ref'),
  RYUNIX_STORE: Symbol.for('ryunix.store'),
  RYUNIX_REDUCE: Symbol.for('ryunix.reduce'),
  RYUNIX_FRAGMENT: Symbol.for('ryunix.fragment'),
  RYUNIX_CONTEXT: Symbol.for('ryunix.context'),
  RYUNIX_SUSPENSE: Symbol.for('ryunix.suspense'),
})

export const STRINGS = Object.freeze({
  OBJECT: 'object',
  FUNCTION: 'function',
  STYLE: 'ryunix-style',
  CLASS_NAME: 'ryunix-class',
  CHILDREN: 'children',
  BOOLEAN: 'boolean',
  STRING: 'string',
  UNDEFINED: 'undefined',
})

export const OLD_STRINGS = Object.freeze({
  STYLE: 'style',
  CLASS_NAME: 'className',
})

export const EFFECT_TAGS = Object.freeze({
  PLACEMENT: Symbol.for('ryunix.reconciler.status.placement'),
  UPDATE: Symbol.for('ryunix.reconciler.status.update'),
  DELETION: Symbol.for('ryunix.reconciler.status.deletion'),
  NO_EFFECT: Symbol.for('ryunix.reconciler.status.no_effect'),
  HYDRATE: Symbol.for('ryunix.reconciler.status.hydrate'),
})

export function flattenArray<T>(arr: T[] | T, depth = 1): T[] {
  if (!Array.isArray(arr)) return [arr]
  if (depth < 1) return arr.slice()

  return arr.reduce<T[]>((acc, val) => {
    if (Array.isArray(val) && depth > 0) {
      acc.push(...flattenArray(val, depth - 1))
    } else {
      acc.push(val)
    }
    return acc
  }, [])
}

export const is = {
  object: (val: unknown): val is object =>
    val !== null && typeof val === STRINGS.OBJECT,
  function: (val: unknown): val is (...args: never[]) => unknown =>
    typeof val === STRINGS.FUNCTION,
  string: (val: unknown): val is string => typeof val === STRINGS.STRING,
  undefined: (val: unknown): val is undefined =>
    typeof val === STRINGS.UNDEFINED,
  null: (val: unknown): val is null => val === null,
  array: (val: unknown): val is unknown[] => Array.isArray(val),
  promise: (val: unknown): val is Promise<unknown> => val instanceof Promise,
}

export function getTypeLabel(type: unknown): string {
  if (typeof type === 'symbol') return type.description || type.toString()
  if (typeof type === 'function') return type.name || 'anonymous'
  return String(type)
}

export function nextValidSibling(
  node: ChildNode | null | undefined,
): ChildNode | null | undefined {
  let next = node
  while (
    next &&
    ((next.nodeType === 3 && !next.nodeValue?.trim()) ||
      next.nodeType === 8 ||
      (next.nodeType === 1 &&
        (next as Element).hasAttribute('data-ryunix-ssr')))
  ) {
    next = next.nextSibling
  }
  return next
}

export { CAMEL_TO_KEBAB_REGEX, rIC }
