import { RYUNIX_TYPES, STRINGS, is } from '../utils/index'

/**
 * Create text element
 */
const createTextElement = (text) => {
  return {
    type: RYUNIX_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

/**
 * Create element
 */
const createElement = (type, props, ...children) => {
  const safeProps = props || {}

  return {
    type,
    props: {
      ...safeProps,
      children: children
        .flat()
        .map((child) =>
          typeof child === STRINGS.OBJECT ? child : createTextElement(child),
        ),
    },
  }
}

/**
 * Fragment component
 */
const Fragment = (props) => {
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children]
  return createElement(RYUNIX_TYPES.RYUNIX_FRAGMENT, {}, ...children)
}

/**
 * Clone element utility
 */
const cloneElement = (element, props = {}, ...children) => {
  if (!element || !is.object(element)) {
    throw new Error('cloneElement requires a valid element')
  }

  const newChildren = children.length > 0 ? children : element.props.children

  return createElement(
    element.type,
    { ...element.props, ...props },
    ...(Array.isArray(newChildren) ? newChildren : [newChildren]),
  )
}

/**
 * Check if valid element
 */
const isValidElement = (object) => {
  return (
    is.object(object) && object.type !== undefined && object.props !== undefined
  )
}

export {
  createElement,
  createTextElement,
  Fragment,
  cloneElement,
  isValidElement,
}
