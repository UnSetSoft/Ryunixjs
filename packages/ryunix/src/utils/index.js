let vars = {
  containerRoot: null,
  nextUnitOfWork: null,
  currentRoot: null,
  wipRoot: null,
  deletions: null,
  wipFiber: null,
  hookIndex: null,
  effects: null,
}

const reg = /[A-Z]/g

const RYUNIX_TYPES = Object.freeze({
  TEXT_ELEMENT: Symbol('text.element').toString(),
  Ryunix_ELEMENT: Symbol('ryunix.element').toString(),
  RYUNIX_EFFECT: Symbol('ryunix.effect').toString(),
  RYUNIX_MEMO: Symbol('ryunix.memo').toString(),
  RYUNIX_URL_QUERY: Symbol('ryunix.urlQuery').toString(),
  RYUNIX_REF: Symbol('ryunix.ref').toString(),
  RYUNIX_STORE: Symbol('ryunix.store').toString(),
  RYUNIX_REDUCE: Symbol('ryunix.reduce').toString(),
  RYUNIX_FRAGMENT: Symbol('ryunix.fragment').toString(),
})

const STRINGS = Object.freeze({
  object: 'object',
  function: 'function',
  style: 'ryunix-style',
  className: 'ryunix-class',
  children: 'children',
  boolean: 'boolean',
  string: 'string',
})

const OLD_STRINGS = Object.freeze({
  style: 'style',
  className: 'className',
})

const EFFECT_TAGS = Object.freeze({
  PLACEMENT: Symbol('ryunix.reconciler.status.placement').toString(),
  UPDATE: Symbol('ryunix.reconciler.status.update').toString(),
  DELETION: Symbol('ryunix.reconciler.status.deletion').toString(),
  NO_EFFECT: Symbol('ryunix.reconciler.status.no_efect').toString(),
})

const generateHash = (prefix) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

const matchPath = (pattern, path) => {
  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = path.split('/').filter(Boolean)

  if (pattern === '*') return {}

  if (patternSegments.length !== pathSegments.length) return null

  const params = {}

  for (let i = 0; i < patternSegments.length; i++) {
    const pSeg = patternSegments[i]
    const pathSeg = pathSegments[i]

    if (pSeg.startsWith(':')) {
      params[pSeg.slice(1)] = decodeURIComponent(pathSeg)
    } else if (pSeg !== pathSeg) {
      return null
    }
  }

  return params
}

const parseQuery = (search) => {
  if (!search) return {}
  return Object.fromEntries(new URLSearchParams(search))
}

export {
  vars,
  reg,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  STRINGS,
  OLD_STRINGS,
  generateHash,
  matchPath,
  parseQuery,
}
