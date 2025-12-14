// Improved state management - avoid global mutable object
// Instead, create a state manager that can be instantiated per render tree

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

// Singleton for backward compatibility, but allows testing with isolated instances
let globalState = createRenderState()

const getState = () => globalState
const resetState = () => {
  globalState = createRenderState()
  return globalState
}

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
})

/**
 * Generate a unique hash with optional prefix
 * @param {string} prefix - Optional prefix for the hash
 * @returns {string} Unique hash string
 */
const generateHash = (prefix = 'ryunix') => {
  const randomPart = Math.random().toString(36).substring(2, 11)
  const timestamp = Date.now().toString(36)
  return `${prefix}-${timestamp}-${randomPart}`
}

/**
 * Match a route pattern against a path
 * @param {string} pattern - Route pattern with :params
 * @param {string} path - URL path to match
 * @returns {Object|null} Params object or null if no match
 */
const matchPath = (pattern, path) => {
  if (!pattern || !path) return null

  // Wildcard matches everything
  if (pattern === '*') return {}

  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = path.split('/').filter(Boolean)

  // Different number of segments = no match
  if (patternSegments.length !== pathSegments.length) return null

  const params = {}

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i]
    const pathSeg = pathSegments[i]

    if (patternSeg.startsWith(':')) {
      // Dynamic segment
      const paramName = patternSeg.slice(1)
      params[paramName] = decodeURIComponent(pathSeg)
    } else if (patternSeg !== pathSeg) {
      // Static segment doesn't match
      return null
    }
  }

  return params
}

/**
 * Parse query string into object
 * @param {string} search - Query string (with or without ?)
 * @returns {Object} Parsed query parameters
 */
const parseQuery = (search) => {
  if (!search) return {}

  // Remove leading ? if present
  const cleanSearch = search.startsWith('?') ? search.slice(1) : search

  if (!cleanSearch) return {}

  try {
    return Object.fromEntries(new URLSearchParams(cleanSearch))
  } catch (error) {
    console.warn('Failed to parse query string:', error)
    return {}
  }
}

/**
 * Deep equality check for hook dependencies
 * @param {Array} prevDeps - Previous dependencies
 * @param {Array} nextDeps - Next dependencies
 * @returns {boolean} Whether dependencies changed
 */
const haveDepsChanged = (prevDeps, nextDeps) => {
  if (!prevDeps || !nextDeps) return true
  if (prevDeps.length !== nextDeps.length) return true

  return prevDeps.some((dep, index) => !Object.is(dep, nextDeps[index]))
}

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

/**
 * Type checking utilities
 */
const is = {
  object: (val) => val !== null && typeof val === STRINGS.OBJECT,
  function: (val) => typeof val === STRINGS.FUNCTION,
  string: (val) => typeof val === STRINGS.STRING,
  undefined: (val) => typeof val === STRINGS.UNDEFINED,
  null: (val) => val === null,
  array: (val) => Array.isArray(val),
  promise: (val) => val instanceof Promise,
}

export {
  getState,
  resetState,
  createRenderState,
  CAMEL_TO_KEBAB_REGEX,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  STRINGS,
  OLD_STRINGS,
  generateHash,
  matchPath,
  parseQuery,
  haveDepsChanged,
  flattenArray,
  is,
}
