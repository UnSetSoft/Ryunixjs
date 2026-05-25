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

/**
 * @typedef {import('../types/internal.js').RyunixFiber} RyunixFiber
 * @typedef {import('../types/internal.js').RyunixComponent} RyunixComponent
 * @typedef {import('../types/internal.js').RyunixNode} RyunixNode
 */

/**
 * @param {RyunixFiber} fiber
 */
const updateFunctionComponent = (fiber) => {
  const state = getState()
  state.wipFiber = fiber
  state.hookIndex = 0
  /** @type {RyunixFiber} */ state.wipFiber.hooks = []

  if (state.isHydrating) {
    fiber.effectTag = EFFECT_TAGS.HYDRATE
  }

  // Memo bailout: skip re-render if props haven't changed
  const componentType =
    /** @type {RyunixComponent & { _arePropsEqual?: (prev: Record<string, unknown>, next: Record<string, unknown>) => boolean }} */ fiber.type
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

  let children = [
    /** @type {RyunixNode} */ /** @type {(props?: Record<string, unknown>) => unknown} */ componentType(
      fiber.props,
    ),
  ]

  if (componentType._contextId && fiber.props?.value !== undefined) {
    fiber._contextId = componentType._contextId
    fiber._contextValue = fiber.props.value
  }

  reconcileChildren(fiber, children)
}

/**
 * @param {RyunixFiber} fiber
 */
const updateHostComponent = (fiber) => {
  const state = getState()

  if (fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    fiber._contextId =
      /** @type {string | symbol | undefined} */ fiber.props?._contextId
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
        (domNode as Element).tagName.toLowerCase() === fiber.type.toLowerCase()

      if (isText || isElement) {
        fiber.dom = /** @type {HTMLElement | Text} */ domNode
        fiber.effectTag = EFFECT_TAGS.HYDRATE
        // Move cursor to first child for children to consume
        state.hydrateCursor = nextValidSibling(domNode.firstChild)
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[Hydration] Mismatch at ${getTypeLabel(fiber.type)}. Expected ${
              domNode.nodeType === 1 ? (domNode as Element).tagName : 'text'
            } but got ${String(fiber.type)}. Falling back to CSR.`,
          )
        }
        state.isHydrating = false
        state.hydrationFailed = true
        state.hydrateCursor = null
        fiber.dom = /** @type {HTMLElement | Text | null} */ createDom(fiber)
        fiber.effectTag = EFFECT_TAGS.PLACEMENT
      }
    } else {
      fiber.dom = /** @type {HTMLElement | Text | null} */ createDom(fiber)
    }
  }

  const children = fiber.props?.children || []
  reconcileChildren(fiber, children)
}

/**
 * @param {string | symbol | RyunixComponent | object} type
 * @returns {string}
 */
const getTypeLabel = (type) => {
  if (typeof type === 'symbol') return type.description || type.toString()
  if (typeof type === 'function') return type.name || 'anonymous'
  return String(type)
}

/**
 * The Component `Image` takes in a `src` and other props, and returns an `img` element with the
 * specified `src` and props.
 * @returns The `Image` component is being returned. It is a functional component that renders an `img`
 * element with the specified `src` and other props passed to it.
 */
/**
 * @param {{ src: string } & Record<string, unknown>} props
 * @returns {import('./createElement.js').RyunixElement}
 */
const Image = ({ src, ...props }) => {
  return createElement('img', { ...props, src })
}

const { Provider: MDXProvider, useContext: useMDXComponents } = createContext(
  'ryunix.mdx',
  /** @type {Record<string, RyunixComponent>} */ {},
)

/**
 * Get merged MDX components from context and provided components
 * @param {Record<string, RyunixComponent>} [components] - Additional components to merge
 * @returns {Record<string, RyunixComponent>} Merged components object
 */
const getMDXComponents = (components) => {
  const contextComponents = useMDXComponents() as Record<
    string,
    import('../types/internal.js').RyunixComponent
  >
  return {
    ...contextComponents,
    ...components,
  }
}

/**
 * @param {string} tag
 * @param {Record<string, unknown>} props
 * @returns {RyunixNode}
 */
const mdxHost = (tag, props) =>
  /** @type {RyunixNode} */ createElement(tag, props)

/**
 * Default MDX components with Ryunix-optimized rendering
 * @type {Record<string, (props: Record<string, unknown>) => RyunixNode>}
 */
const defaultComponents = {
  // Headings
  h1: (props) => mdxHost('h1', props),
  h2: (props) => mdxHost('h2', props),
  h3: (props) => mdxHost('h3', props),
  h4: (props) => mdxHost('h4', props),
  h5: (props) => mdxHost('h5', props),
  h6: (props) => mdxHost('h6', props),

  // Text
  p: (props) => mdxHost('p', props),
  a: (props) => mdxHost('a', props),
  strong: (props) => mdxHost('strong', props),
  em: (props) => mdxHost('em', props),
  code: (props) => mdxHost('code', props),

  // Lists
  ul: (props) => mdxHost('ul', props),
  ol: (props) => mdxHost('ol', props),
  li: (props) => mdxHost('li', props),

  // Blocks
  blockquote: (props) => mdxHost('blockquote', props),
  pre: (props) => mdxHost('pre', props),
  hr: (props) => mdxHost('hr', props),

  // Tables
  table: (props) => mdxHost('table', props),
  thead: (props) => mdxHost('thead', props),
  tbody: (props) => mdxHost('tbody', props),
  tr: (props) => mdxHost('tr', props),
  th: (props) => mdxHost('th', props),
  td: (props) => mdxHost('td', props),

  // Media
  img: (props) => mdxHost('img', props),
}

/**
 * MDX Wrapper component
 * Provides default styling and components for MDX content
 */
/**
 * @param {{ children?: RyunixNode, components?: Record<string, RyunixComponent> }} props
 * @returns {import('./createElement.js').RyunixElement}
 */
const MDXContent = ({ children, components = {} }) => {
  const mergedComponents = getMDXComponents(components)

  return createElement(
    /** @type {string | symbol | Function} */ MDXProvider,
    { value: mergedComponents },
    createElement('div', null, children),
  )
}

export {
  // Internal use
  updateFunctionComponent,
  updateHostComponent,

  // Built-in components

  // MDX Support
  MDXContent,
  MDXProvider,
  useMDXComponents,
  getMDXComponents,
  defaultComponents,

  // Custom components
  Image,
}
