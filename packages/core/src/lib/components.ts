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
import {
  logHydrationBoundaryMismatch,
  logHydrationFatal,
  logHydrationMismatch,
  logHydrationRecoverable,
} from './hydrationLog.js'
import {
  enqueueScopedRecovery,
  findNearestHydrationBoundary,
  getBoundaryDom,
  getHydrationPolicy,
  skipHydrationSubtree,
} from './hydration.js'

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
 * @param {RyunixFiber | null | undefined} fiber
 * @returns {boolean}
 */
const isUnderClientOnlyBoundary = (fiber) => {
  let current = fiber?.parent || null
  while (current) {
    if (current._hydrateClientOnly) return true
    current = current.parent || null
  }
  return false
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
  } else if (state.isHydrating && isUnderClientOnlyBoundary(fiber)) {
    if (!fiber.dom) {
      fiber.dom = /** @type {HTMLElement | Text | null} */ createDom(fiber)
      fiber.effectTag = EFFECT_TAGS.PLACEMENT
    }
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

        if (
          isText &&
          fiber.props?.nodeValue != null &&
          domNode.nodeValue !== String(fiber.props.nodeValue)
        ) {
          domNode.nodeValue = String(fiber.props.nodeValue)
          logHydrationRecoverable('text')
        }

        if (
          isElement &&
          (domNode as Element).hasAttribute('data-ryunix-hydrate-boundary')
        ) {
          fiber._hydrateClientOnly = true
        }

        state.hydrateCursor = nextValidSibling(domNode.firstChild)
      } else {
        const policy = getHydrationPolicy()
        const detail = `Mismatch at ${getTypeLabel(fiber.type)}. Expected ${
          domNode.nodeType === 1 ? (domNode as Element).tagName : 'text'
        } but got ${String(fiber.type)}.`
        const boundaryFiber = findNearestHydrationBoundary(fiber)
        const boundaryDom = boundaryFiber ? getBoundaryDom(boundaryFiber) : null

        if (policy.recover === 'boundary' && boundaryFiber && boundaryDom) {
          logHydrationBoundaryMismatch(detail)
          enqueueScopedRecovery(
            boundaryFiber,
            boundaryDom,
            state.hydrateCursor ?? null,
          )
          state.hydrateCursor = skipHydrationSubtree(
            state.hydrateCursor ?? null,
            boundaryDom,
          )
          fiber.dom = /** @type {HTMLElement | Text | null} */ createDom(fiber)
          fiber.effectTag = EFFECT_TAGS.PLACEMENT
        } else if (policy.recover === 'none') {
          logHydrationFatal(detail)
          state.isHydrating = false
          state.hydrateCursor = null
          fiber.dom = /** @type {HTMLElement | Text | null} */ createDom(fiber)
          fiber.effectTag = EFFECT_TAGS.PLACEMENT
        } else {
          logHydrationMismatch(detail)
          state.isHydrating = false
          state.hydrationFailed = true
          state.hydrateCursor = null
          fiber.dom = /** @type {HTMLElement | Text | null} */ createDom(fiber)
          fiber.effectTag = EFFECT_TAGS.PLACEMENT
        }
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

const RYUNIX_STYLE_ENABLED =
  globalThis.process && String(globalThis.process.env?.RYUNIX_STYLE) !== 'false'

/**
 * Maps `unstyled` prop to `data-ryx-unstyled` for global style opt-out.
 * @param {Record<string, unknown>} props
 * @returns {Record<string, unknown>}
 */
const ryxProps = (props) => {
  const { unstyled, ...rest } = props
  if (unstyled || rest['data-ryx-unstyled']) {
    return { ...rest, 'data-ryx-unstyled': true }
  }
  return rest
}

/**
 * @param {unknown} existing
 * @param {string} base
 */
const mergeClassName = (existing, base) => {
  if (!existing) return base
  if (Array.isArray(existing)) return [...existing, base].join(' ')
  return `${existing} ${base}`
}

/**
 * @param {string} tag
 * @param {string} [ryxClass]
 * @param {Record<string, unknown>} props
 * @returns {RyunixNode}
 */
const styledMdxHost = (tag, ryxClass, props) => {
  const next = ryxProps(props)
  if (!RYUNIX_STYLE_ENABLED || !ryxClass || next['data-ryx-unstyled']) {
    return /** @type {RyunixNode} */ createElement(tag, next)
  }
  return /** @type {RyunixNode} */ createElement(tag, {
    ...next,
    className: mergeClassName(next.className, ryxClass),
  })
}

/**
 * @param {string} tag
 * @param {Record<string, unknown>} props
 * @returns {RyunixNode}
 */
const mdxHost = (tag, props) => styledMdxHost(tag, undefined, props)

/**
 * Default MDX components with Ryunix-optimized rendering
 * @type {Record<string, (props: Record<string, unknown>) => RyunixNode>}
 */
const defaultComponents = {
  h1: (props) => styledMdxHost('h1', 'ryx-h1', props),
  h2: (props) => styledMdxHost('h2', 'ryx-h2', props),
  h3: (props) => styledMdxHost('h3', 'ryx-h3', props),
  h4: (props) => styledMdxHost('h4', 'ryx-h4', props),
  h5: (props) => styledMdxHost('h5', 'ryx-h5', props),
  h6: (props) => styledMdxHost('h6', 'ryx-h6', props),
  p: (props) => styledMdxHost('p', 'ryx-p', props),
  a: (props) => styledMdxHost('a', 'ryx-a', props),
  strong: (props) => styledMdxHost('strong', 'ryx-strong', props),
  em: (props) => styledMdxHost('em', 'ryx-em', props),
  code: (props) => styledMdxHost('code', 'ryx-code', props),
  ul: (props) => styledMdxHost('ul', 'ryx-ul', props),
  ol: (props) => styledMdxHost('ol', 'ryx-ol', props),
  li: (props) => styledMdxHost('li', 'ryx-li', props),
  blockquote: (props) => styledMdxHost('blockquote', 'ryx-blockquote', props),
  pre: (props) => styledMdxHost('pre', 'ryx-pre', props),
  hr: (props) => styledMdxHost('hr', 'ryx-hr', props),
  table: (props) => styledMdxHost('table', 'ryx-table', props),
  thead: (props) => styledMdxHost('thead', 'ryx-thead', props),
  tbody: (props) => styledMdxHost('tbody', 'ryx-tbody', props),
  tr: (props) => styledMdxHost('tr', 'ryx-tr', props),
  th: (props) => styledMdxHost('th', 'ryx-th', props),
  td: (props) => styledMdxHost('td', 'ryx-td', props),
  img: (props) => styledMdxHost('img', 'ryx-img', props),
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
  ryxProps,

  // Custom components
  Image,
}
