import { createDom } from './dom'
import { reconcileChildren } from './reconciler'
import { getState } from '../utils/index'
import { createElement } from './createElement'
import { createContext } from './hooks'

const updateFunctionComponent = (fiber) => {
  const state = getState()
  state.wipFiber = fiber
  state.hookIndex = 0
  state.wipFiber.hooks = []

  const children = [fiber.type(fiber.props)]

  if (fiber.type._contextId && fiber.props.value !== undefined) {
    fiber._contextId = fiber.type._contextId
    fiber._contextValue = fiber.props.value
  }

  reconcileChildren(fiber, children)
}

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  const children = fiber.props?.children || []
  reconcileChildren(fiber, children)
}

/* Image component */
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

  // Buil-in components

  // MDX Support
  MDXContent,
  MDXProvider,
  useMDXComponents,
  getMDXComponents,
  defaultComponents,

  // Custom components
  Image,
}
