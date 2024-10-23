const vars = {
  containerRoot: undefined,
  nextUnitOfWork: undefined,
  currentRoot: undefined,
  wipRoot: undefined,
  deletions: [],
  workInProgressFiber: undefined,
  hookIndex: 0,
  errorBoundary: null, // New property to hold error boundary references
}

const capitalLetterRegex = /[A-Z]/g

const RYUNIX_TYPES = Object.freeze({
  TEXT_ELEMENT: Symbol('text.element'),
  RYUNIX_EFFECT: Symbol('ryunix.effect'),
  RYUNIX_MEMO: Symbol('ryunix.memo'),
  RYUNIX_URL_QUERY: Symbol('ryunix.urlQuery'),
  RYUNIX_REF: Symbol('ryunix.ref'),
  RYUNIX_ERROR_BOUNDARY: Symbol('ryunix.errorBoundary'), // New Error Boundary Type
})

const STRINGS = Object.freeze({
  object: 'object',
  function: 'function',
  style: 'ryunix-style',
  className: 'ryunix-class',
  children: 'children',
  boolean: 'boolean',
})

const OLD_STRINGS = Object.freeze({
  style: 'style',
  className: 'className',
})

const EFFECT_TAGS = Object.freeze({
  PLACEMENT: Symbol('placement'),
  UPDATE: Symbol('update'),
  DELETION: Symbol('deletion'),
})

export { vars, capitalLetterRegex, RYUNIX_TYPES, EFFECT_TAGS, STRINGS, OLD_STRINGS }
