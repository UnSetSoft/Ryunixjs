const rICFallback = (cb) => setTimeout(() => cb({ timeRemaining: () => 1 }), 1)
const rIC =
  typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : rICFallback
const createRenderState = () => ({
  containerRoot: null,
  nextUnitOfWork: null,
  currentRoot: null,
  wipRoot: null,
  deletions: [],
  wipFiber: null,
  hookIndex: 0,
  effects: [],
})
let globalState = createRenderState()
export const getState = () => globalState
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
export function flattenArray(arr, depth = 1) {
  if (!Array.isArray(arr)) return [arr]
  if (depth < 1) return arr.slice()
  return arr.reduce((acc, val) => {
    if (Array.isArray(val) && depth > 0) {
      acc.push(...flattenArray(val, depth - 1))
    } else {
      acc.push(val)
    }
    return acc
  }, [])
}
export const is = {
  object: (val) => val !== null && typeof val === STRINGS.OBJECT,
  function: (val) => typeof val === STRINGS.FUNCTION,
  string: (val) => typeof val === STRINGS.STRING,
  undefined: (val) => typeof val === STRINGS.UNDEFINED,
  null: (val) => val === null,
  array: (val) => Array.isArray(val),
  promise: (val) => val instanceof Promise,
}
export function getTypeLabel(type) {
  if (typeof type === 'symbol') return type.description || type.toString()
  if (typeof type === 'function') return type.name || 'anonymous'
  return String(type)
}
export function nextValidSibling(node) {
  let next = node
  while (
    next &&
    ((next.nodeType === 3 && !next.nodeValue?.trim()) ||
      next.nodeType === 8 ||
      (next.nodeType === 1 && next.hasAttribute('data-ryunix-ssr')))
  ) {
    next = next.nextSibling
  }
  return next
}
export { CAMEL_TO_KEBAB_REGEX, rIC }
