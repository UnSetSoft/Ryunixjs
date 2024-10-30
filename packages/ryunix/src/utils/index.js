let vars = {
  containerRoot: {},
  nextUnitOfWork: {},
  currentRoot: {},
  wipRoot: {},
  deletions: [],
  wipFiber: {},
  hookIndex: 0,
}

const reg = /[A-Z]/g

const RYUNIX_TYPES = Object.freeze({
  TEXT_ELEMENT: Symbol('text.element'),
  Ryunix_ELEMENT: Symbol('ryunix.element'),
  RYUNIX_EFFECT: Symbol('ryunix.effect'),
  RYUNIX_MEMO: Symbol('ryunix.memo'),
  RYUNIX_URL_QUERY: Symbol('ryunix.urlQuery'),
  RYUNIX_REF: Symbol('ryunix.ref'),
  RYUNIX_STORE: Symbol('ryunix.store'),
  RYUNIX_REDUCE: Symbol('ryunix.reduce'),
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
})

const Fiber = ({
  _id = generateUnicHash('fiber'),
  type,
  props,
  parent,
  alternate,
  effectTag,
  dom,
  child,
  sibling,
  hooks = [],
  key,
}) => {
  return {
    _id,
    type,
    props,
    parent,
    dom,
    alternate,
    child,
    sibling,
    effectTag,
    hooks,
    key,
  }
}

const generateHash = (deps) => {
  return deps.map((dep) => JSON.stringify(dep)).join('-')
}

const generateHookHash = (fiber, descriptor) => {
  return `${fiber.key}-${descriptor.toString()}-${Math.random()
    .toString(36)
    .substring(2, 9)}` // Or any other unique combination
}

const generateUnicHash = (prefix) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

export {
  vars,
  reg,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  STRINGS,
  OLD_STRINGS,
  generateHash,
  generateHookHash,
  Fiber,
}
