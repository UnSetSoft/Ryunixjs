let containerRoot = null;
let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;
const reg = /[A-Z]/g;

const RYUNIX_TYPES = Object.freeze({
  TEXT_ELEMENT: Symbol("text.element"),
  RYUNIX_EFFECT: Symbol("ryunix.effect"),
  RYUNIX_CONTEXT: Symbol("ryunix.context"),
});

const STRINGS = Object.freeze({
  object: "object",
  function: "function",
  style: "style",
  className: "className",
  children: "children",
});

const EFFECT_TAGS = Object.freeze({
  PLACEMENT: Symbol(),
  UPDATE: Symbol(),
  DELETION: Symbol(),
});

export {
  containerRoot,
  nextUnitOfWork,
  currentRoot,
  wipRoot,
  deletions,
  wipFiber,
  hookIndex,
  reg,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  STRINGS,
};
