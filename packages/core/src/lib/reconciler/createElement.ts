import { RYUNIX_TYPES, STRINGS, is } from '../../utils/index.js'
import type {
  RyunixElement,
  RyunixNode,
  RyunixTextElement,
} from '../../types/internal.js'

/**
 * @param {string | number | boolean} text
 * @returns {RyunixTextElement}
 */
const createTextElement = (text) => {
  return {
    type: RYUNIX_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue: String(text),
      children: [],
    },
  }
}

/**
 * Create a virtual DOM element.
 * @param {string | symbol | RyunixComponent} type
 * @param {RyunixProps | null} [props]
 * @param {...RyunixNode} children
 * @returns {RyunixElement}
 */
const createElement = (type, props, ...children) => {
  const safeProps = props || {}
  let rawChildren = children
  if (children.length === 0 && safeProps.children !== undefined) {
    rawChildren = Array.isArray(safeProps.children)
      ? safeProps.children
      : [safeProps.children]
  }

  rawChildren = rawChildren
    .flat()
    .filter((child) => child != null && child !== false && child !== true)

  /** @type {RyunixNode[]} */
  const normalizedChildren = []
  let currentText = ''

  for (const child of rawChildren) {
    if (typeof child !== STRINGS.OBJECT) {
      currentText += String(child)
    } else {
      if (currentText !== '') {
        normalizedChildren.push(createTextElement(currentText))
        currentText = ''
      }
      normalizedChildren.push(child)
    }
  }

  if (currentText !== '') {
    normalizedChildren.push(createTextElement(currentText))
  }

  return {
    type,
    props: {
      ...safeProps,
      children: normalizedChildren,
    },
  }
}

/**
 * @param {{ children?: RyunixNode | RyunixNode[] }} props
 * @returns {RyunixElement}
 */
const Fragment = (props) => {
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children]
  return createElement(RYUNIX_TYPES.RYUNIX_FRAGMENT, {}, ...children)
}

/**
 * @param {RyunixElement} element
 * @param {RyunixProps} [props]
 * @param {...RyunixNode} children
 * @returns {RyunixElement}
 */
const cloneElement = (
  element: RyunixElement,
  props: Record<string, unknown> = {},
  ...children: RyunixNode[]
): RyunixElement => {
  if (!element || !is.object(element)) {
    throw new Error('cloneElement requires a valid element')
  }

  const newChildren =
    children.length > 0 ? children : (element.props.children ?? [])

  return createElement(
    element.type,
    { ...element.props, ...props },
    ...(Array.isArray(newChildren) ? newChildren : [newChildren]),
  )
}

const isValidElement = (object: unknown): object is RyunixElement => {
  return (
    is.object(object) &&
    (object as RyunixElement).type !== undefined &&
    (object as RyunixElement).props !== undefined
  )
}

export {
  createElement,
  createTextElement,
  Fragment,
  cloneElement,
  isValidElement,
}
