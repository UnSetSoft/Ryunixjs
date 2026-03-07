import { createDom, clearContainer } from './dom'
import { reconcileChildren } from './reconciler'
import { getState, RYUNIX_TYPES, EFFECT_TAGS } from '../utils/index'
import { createElement } from './createElement'
import { createContext } from './hooks'

const updateFunctionComponent = (fiber) => {
  const state = getState()
  state.wipFiber = fiber
  state.hookIndex = 0
  state.wipFiber.hooks = []

  if (state.isHydrating) {
    fiber.effectTag = EFFECT_TAGS.HYDRATE
  }

  const children = [fiber.type(fiber.props)]

  if (fiber.type._contextId && fiber.props.value !== undefined) {
    fiber._contextId = fiber.type._contextId
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
      const isText = fiber.type === RYUNIX_TYPES.TEXT_ELEMENT && domNode.nodeType === 3
      const isElement = typeof fiber.type === 'string' && domNode.nodeType === 1 && domNode.tagName.toLowerCase() === fiber.type.toLowerCase()

      if (isText || isElement) {
        fiber.dom = domNode
        fiber.effectTag = EFFECT_TAGS.HYDRATE
        state.hydrateCursor = domNode.nextSibling
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[Hydration] Mismatch at ${fiber.type}. Falling back to CSR.`)
        }

        // On mismatch, mark as failed. The commit phase will handle appending
        // and commitRoot will handle clearing the container if needed.
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

  let prevCursor = state.hydrateCursor
  const isRealDom = fiber.dom != null

  if (state.isHydrating && isRealDom && fiber.effectTag === EFFECT_TAGS.HYDRATE) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Ryunix Debug] Stepping into children of: ${fiber.type}`);
    }
    state.hydrateCursor = fiber.dom.firstChild
  }

  const children = fiber.props?.children || []
  reconcileChildren(fiber, children)

  if (state.isHydrating && fiber.effectTag === EFFECT_TAGS.HYDRATE) {
    if (isRealDom) {
      // After reconciling all children, if there are still siblings in the DOM,
      // they were NOT matched by any client fiber. We must remove them.
      let cursor = state.hydrateCursor
      if (process.env.NODE_ENV !== 'production' && cursor) {
        console.log(`[Ryunix Debug] Cleaning up unconsumed children of: ${fiber.type}`);
      }
      while (cursor) {
        const next = cursor.nextSibling
        if (cursor.parentNode) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Ryunix Debug] Removing stale SSR child:', cursor);
          }
          cursor.parentNode.removeChild(cursor)
        }
        cursor = next
      }
      // Restore cursor to the next sibling of THIS node for the next sibling fiber
      state.hydrateCursor = prevCursor ? prevCursor.nextSibling : null
    }
  }
}


/**
 * The Component `Image` takes in a `src` and other props, and returns an `img` element with the
 * specified `src` and props.
 * @returns The `Image` component is being returned. It is a functional component that renders an `img`
 * element with the specified `src` and other props passed to it.
 */
const Image = ({ src, ...props }) => {
  return createElement('img', { ...props, src })
}

const { Provider: MDXProvider, useContext: useMDXComponents } = createContext(
  'ryunix.mdx',
  {},
)

/**
 * Get merged MDX components from context and provided components
 * @param {Object} components - Additional components to merge
 * @returns {Object} Merged components object
 */
const getMDXComponents = (components) => {
  const contextComponents = useMDXComponents()
  return {
    ...contextComponents,
    ...components,
  }
}

/**
 * Default MDX components with Ryunix-optimized rendering
 */
const defaultComponents = {
  // Headings
  h1: (props) => createElement('h1', { ...props }),
  h2: (props) => createElement('h2', { ...props }),
  h3: (props) => createElement('h3', { ...props }),
  h4: (props) => createElement('h4', { ...props }),
  h5: (props) => createElement('h5', { ...props }),
  h6: (props) => createElement('h6', { ...props }),

  // Text
  p: (props) => createElement('p', { ...props }),
  a: (props) => createElement('a', { ...props }),
  strong: (props) => createElement('strong', { ...props }),
  em: (props) => createElement('em', { ...props }),
  code: (props) => createElement('code', { ...props }),

  // Lists
  ul: (props) => createElement('ul', { ...props }),
  ol: (props) => createElement('ol', { ...props }),
  li: (props) => createElement('li', { ...props }),

  // Blocks
  blockquote: (props) => createElement('blockquote', { ...props }),
  pre: (props) => createElement('pre', { ...props }),
  hr: (props) => createElement('hr', { ...props }),

  // Tables
  table: (props) => createElement('table', { ...props }),
  thead: (props) => createElement('thead', { ...props }),
  tbody: (props) => createElement('tbody', { ...props }),
  tr: (props) => createElement('tr', { ...props }),
  th: (props) => createElement('th', { ...props }),
  td: (props) => createElement('td', { ...props }),

  // Media
  img: (props) => createElement('img', { ...props }),
}

/**
 * MDX Wrapper component
 * Provides default styling and components for MDX content
 */
const MDXContent = ({ children, components = {} }) => {
  const mergedComponents = getMDXComponents(components)

  return createElement(
    MDXProvider,
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
