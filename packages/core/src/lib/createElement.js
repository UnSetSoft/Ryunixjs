import { RYUNIX_TYPES, STRINGS, is } from '../utils/index.js'
const createTextElement = (text) => {
  return {
    type: RYUNIX_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue: String(text),
      children: [],
    },
  }
}
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
const Fragment = (props) => {
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children]
  return createElement(RYUNIX_TYPES.RYUNIX_FRAGMENT, {}, ...children)
}
const cloneElement = (element, props = {}, ...children) => {
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
