import { RYUNIX_TYPES, STRINGS, is } from '../utils/index'

/**
 * The `createTextElement` function creates a text element with the specified text content.
 * @param text - The `text` parameter in the `createTextElement` function is the text content that you
 * want to create a text element for. This text will be set as the `nodeValue` of the text element in
 * the returned object.
 * @returns A text element object is being returned with a type of RYUNIX_TYPES.TEXT_ELEMENT and props
 * containing the text value provided in the function argument.
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
 * The `createElement` function creates a virtual DOM element with specified type, properties, and
 * children.
 * @param type - The `type` parameter in the `createElement` function represents the type of element
 * you want to create, such as a HTML tag like 'div', 'span', 'p', etc.
 * @param props - The `props` parameter in the `createElement` function is an object that contains the
 * properties or attributes for the element being created. These properties can include things like
 * class names, styles, event handlers, and any other custom attributes you want to assign to the
 * element. In the code snippet you provided,
 * @param children - The `children` parameter in the `createElement` function represents the child
 * elements or text content that will be nested within the created element. These children can be
 * passed as arguments to the `createElement` function and will be rendered as part of the element's
 * content.
 * @returns An object is being returned with a `type` property representing the type of element, and a
 * `props` property containing the element's properties. The `props` object includes the children of
 * the element, which are processed to ensure they are in the correct format.
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
 * The `Fragment` function in JavaScript creates a fragment element with the given children.
 * @param props - The `props` parameter in the `Fragment` function is an object that contains the
 * properties passed to the `Fragment` component. These properties can include `children`, which
 * represents the child elements or components nested within the `Fragment`.
 * @returns The `Fragment` component is returning a Ryunix fragment element created using the
 * `createElement` function. The element is of type `RYUNIX_TYPES.RYUNIX_FRAGMENT` and contains the
 * children passed to the `Fragment` component. If `props.children` is not an array, it is converted
 * into an array before being spread into the `createElement` function.
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
