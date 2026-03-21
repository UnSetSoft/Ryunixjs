// Improved state management - avoid global mutable object
// Instead, create a state manager that can be instantiated per render tree

const rIC =
  typeof requestIdleCallback !== 'undefined'
    ? requestIdleCallback
    : (cb) => setTimeout(() => cb({ timeRemaining: () => 1 }), 1)

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

const getState = () => globalState

// Use const for regex to prevent accidental modification
const CAMEL_TO_KEBAB_REGEX = /[A-Z]/g

const RYUNIX_TYPES = Object.freeze({
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

const STRINGS = Object.freeze({
  OBJECT: 'object',
  FUNCTION: 'function',
  STYLE: 'ryunix-style',
  CLASS_NAME: 'ryunix-class',
  CHILDREN: 'children',
  BOOLEAN: 'boolean',
  STRING: 'string',
  UNDEFINED: 'undefined',
})

const OLD_STRINGS = Object.freeze({
  STYLE: 'style',
  CLASS_NAME: 'className',
})

const EFFECT_TAGS = Object.freeze({
  PLACEMENT: Symbol.for('ryunix.reconciler.status.placement'),
  UPDATE: Symbol.for('ryunix.reconciler.status.update'),
  DELETION: Symbol.for('ryunix.reconciler.status.deletion'),
  NO_EFFECT: Symbol.for('ryunix.reconciler.status.no_effect'),
  HYDRATE: Symbol.for('ryunix.reconciler.status.hydrate'),
})

/**
 * Safe array flattening
 * @param {Array} arr - Array to flatten
 * @param {number} depth - Depth to flatten (default: 1)
 * @returns {Array} Flattened array
 */
const flattenArray = (arr, depth = 1) => {
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

const is = {
  object: (val) => val !== null && typeof val === STRINGS.OBJECT,
  function: (val) => typeof val === STRINGS.FUNCTION,
  string: (val) => typeof val === STRINGS.STRING,
  undefined: (val) => typeof val === STRINGS.UNDEFINED,
  null: (val) => val === null,
  array: (val) => Array.isArray(val),
  promise: (val) => val instanceof Promise,
}

const getTypeLabel = (type) => {
  if (typeof type === 'symbol') return type.description || type.toString()
  if (typeof type === 'function') return type.name || 'anonymous'
  return String(type)
}

const nextValidSibling = (node) => {
  let next = node
  while (
    next &&
    ((next.nodeType === 3 && !next.nodeValue.trim()) ||
      next.nodeType === 8 ||
      (next.nodeType === 1 && next.hasAttribute('data-ryunix-ssr')))
  ) {
    next = next.nextSibling
  }
  return next
}

export {
  getState,
  CAMEL_TO_KEBAB_REGEX,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  STRINGS,
  OLD_STRINGS,
  flattenArray,
  is,
  rIC,
  nextValidSibling,
  getTypeLabel,
}
