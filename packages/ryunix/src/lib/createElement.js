import { RYUNIX_TYPES, STRINGS } from '../utils/index'

const Fragment = (props) => {
  return props.children
}

const childArray = (children, out) => {
  out = out || []
  if (children == undefined || typeof children == STRINGS.boolean) {
    // pass
  } else if (Array.isArray(children)) {
    children.some((child) => {
      childArray(child, out)
    })
  } else {
    out.push(children)
  }
  return out
}

const cloneElement = (element, props) => {
  return {
    ...element,
    props: {
      ...element.props,
      ...props,
    },
  }
}

/**
 * The function creates a new element with the given type, props, and children.
 * @param type - The type of the element to be created, such as "div", "span", "h1", etc.
 * @param props - The `props` parameter is an object that contains the properties or attributes of the
 * element being created. These properties can include things like `className`, `id`, `style`, and any
 * other custom attributes that the user wants to add to the element. The `props` object is spread
 * using the spread
 * @param children - The `children` parameter is a rest parameter that allows the function to accept
 * any number of arguments after the `props` parameter. These arguments will be treated as children
 * elements of the created element. The `map` function is used to iterate over each child and create a
 * new element if it is not
 * @returns A JavaScript object with a `type` property and a `props` property. The `type` property is
 * set to the `type` argument passed into the function, and the `props` property is an object that
 * includes any additional properties passed in the `props` argument, as well as a `children` property
 * that is an array of any child elements passed in the `...children` argument
 */

const createElement = (type, props, ...children) => {
  children = childArray(children, [])
  const key =
    props && props.key
      ? props.key
      : `${type}-${Math.random().toString(36).substring(2, 9)}`

  return {
    type,
    props: {
      ...props,
      key,
      children: children.map((child) =>
        typeof child === STRINGS.object ? child : createTextElement(child),
      ),
    },
  }
}

/**
 * The function creates a text element with a given text value.
 * @param text - The text content that will be used to create a new text element.
 * @returns A JavaScript object with a `type` property set to `"TEXT_ELEMENT"` and a `props` property
 * that contains a `nodeValue` property set to the `text` parameter and an empty `children` array.
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

export { createElement, createTextElement, Fragment, cloneElement }
