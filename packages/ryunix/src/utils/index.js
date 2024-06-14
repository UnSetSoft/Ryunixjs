const vars = {
  containerRoot: undefined,
  nextUnitOfWork: undefined,
  currentRoot: undefined,
  wipRoot: undefined,
  deletions: undefined,
  wipFiber: undefined,
  hookIndex: undefined,
}

const reg = /[A-Z]/g

const RYUNIX_TYPES = Object.freeze({
  TEXT_ELEMENT: Symbol('text.element'),
  RYUNIX_EFFECT: Symbol('ryunix.effect'),
  RYUNIX_MEMO: Symbol('ryunix.memo'),
  RYUNIX_URL_QUERY: Symbol('ryunix.urlQuery'),
  RYUNIX_REF: Symbol('ryunix.ref'),
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
  PLACEMENT: Symbol(),
  UPDATE: Symbol(),
  DELETION: Symbol(),
})

export { vars, reg, RYUNIX_TYPES, EFFECT_TAGS, STRINGS, OLD_STRINGS }
