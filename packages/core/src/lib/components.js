import { createDom } from './dom.js'
import { reconcileChildren } from './reconciler.js'
import {
  getState,
  RYUNIX_TYPES,
  EFFECT_TAGS,
  nextValidSibling,
} from '../utils/index.js'
import { createElement } from './createElement.js'
import { createContext } from './hooks.js'
const updateFunctionComponent = (fiber) => {
  const state = getState()
  state.wipFiber = fiber
  state.hookIndex = 0
  state.wipFiber.hooks = []
  if (state.isHydrating) {
    fiber.effectTag = EFFECT_TAGS.HYDRATE
  }
  const componentType = fiber.type
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
  let children = [componentType(fiber.props)]
  if (componentType._contextId && fiber.props?.value !== undefined) {
    fiber._contextId = componentType._contextId
    fiber._contextValue = fiber.props.value
  }
  reconcileChildren(fiber, children)
}
const updateHostComponent = (fiber) => {
  const state = getState()
  if (fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    fiber._contextId = fiber.props?._contextId
    fiber._contextValue = fiber.props?.value
  }
  const isPassthrough =
    fiber.type === RYUNIX_TYPES.RYUNIX_FRAGMENT ||
    fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT ||
    fiber.type === Symbol.for('ryunix.portal')
  if (state.isHydrating && isPassthrough) {
    fiber.effectTag = EFFECT_TAGS.HYDRATE
  } else if (!fiber.dom) {
    if (state.isHydrating && state.hydrateCursor) {
      const domNode = state.hydrateCursor
      const isText =
        fiber.type === RYUNIX_TYPES.TEXT_ELEMENT && domNode.nodeType === 3
      const isElement =
        typeof fiber.type === 'string' &&
        domNode.nodeType === 1 &&
        domNode.tagName.toLowerCase() === fiber.type.toLowerCase()
      if (isText || isElement) {
        fiber.dom = domNode
        fiber.effectTag = EFFECT_TAGS.HYDRATE
        state.hydrateCursor = nextValidSibling(domNode.firstChild)
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[Hydration] Mismatch at ${getTypeLabel(fiber.type)}. Expected ${domNode.nodeType === 1 ? domNode.tagName : 'text'} but got ${String(fiber.type)}. Falling back to CSR.`,
          )
        }
        state.isHydrating = false
        state.hydrationFailed = true
        state.hydrateCursor = null
        fiber.dom = createDom(fiber)
        fiber.effectTag = EFFECT_TAGS.PLACEMENT
      }
    } else {
      fiber.dom = createDom(fiber)
    }
  }
  const children = fiber.props?.children || []
  reconcileChildren(fiber, children)
}
const getTypeLabel = (type) => {
  if (typeof type === 'symbol') return type.description || type.toString()
  if (typeof type === 'function') return type.name || 'anonymous'
  return String(type)
}
const Image = ({ src, ...props }) => {
  return createElement('img', { ...props, src })
}
const { Provider: MDXProvider, useContext: useMDXComponents } = createContext(
  'ryunix.mdx',
  {},
)
const getMDXComponents = (components) => {
  const contextComponents = useMDXComponents()
  return {
    ...contextComponents,
    ...components,
  }
}
const mdxHost = (tag, props) => createElement(tag, props)
const defaultComponents = {
  h1: (props) => mdxHost('h1', props),
  h2: (props) => mdxHost('h2', props),
  h3: (props) => mdxHost('h3', props),
  h4: (props) => mdxHost('h4', props),
  h5: (props) => mdxHost('h5', props),
  h6: (props) => mdxHost('h6', props),
  p: (props) => mdxHost('p', props),
  a: (props) => mdxHost('a', props),
  strong: (props) => mdxHost('strong', props),
  em: (props) => mdxHost('em', props),
  code: (props) => mdxHost('code', props),
  ul: (props) => mdxHost('ul', props),
  ol: (props) => mdxHost('ol', props),
  li: (props) => mdxHost('li', props),
  blockquote: (props) => mdxHost('blockquote', props),
  pre: (props) => mdxHost('pre', props),
  hr: (props) => mdxHost('hr', props),
  table: (props) => mdxHost('table', props),
  thead: (props) => mdxHost('thead', props),
  tbody: (props) => mdxHost('tbody', props),
  tr: (props) => mdxHost('tr', props),
  th: (props) => mdxHost('th', props),
  td: (props) => mdxHost('td', props),
  img: (props) => mdxHost('img', props),
}
const MDXContent = ({ children, components = {} }) => {
  const mergedComponents = getMDXComponents(components)
  return createElement(
    MDXProvider,
    { value: mergedComponents },
    createElement('div', null, children),
  )
}
export {
  updateFunctionComponent,
  updateHostComponent,
  MDXContent,
  MDXProvider,
  useMDXComponents,
  getMDXComponents,
  defaultComponents,
  Image,
}
