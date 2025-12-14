import { RYUNIX_TYPES, STRINGS, is, flattenArray } from '../utils/index'

/**
 * Validate element type
 * @param {*} type - Element type to validate
 * @throws {Error} If type is invalid
 */
const validateElementType = (type) => {
  if (!type) {
    throw new Error('Element type cannot be null or undefined')
  }

  const isValid = is.string(type) || is.function(type) || typeof type === 'symbol'

  if (!isValid) {
    throw new Error(
      `Invalid element type: ${typeof type}. Expected string, function, or symbol.`
    )
  }
}

/**
 * Create a text element
 * @param {string|number|boolean} text - Text content
 * @returns {Object} Text element object
 */
const createTextElement = (text) => {
  // Handle null, undefined, boolean
  const nodeValue = text == null || typeof text === 'boolean' ? '' : String(text)

  return {
    type: RYUNIX_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue,
      children: [],
    },
  }
}

/**
 * Process children into valid element structure
 * @param {Array} children - Raw children array
 * @returns {Array} Processed children
 */
const processChildren = (children) => {
  if (!children || children.length === 0) return []

  return flattenArray(children)
    .filter((child) => {
      // Filter out null, undefined, false, true (common in conditional rendering)
      return child != null && child !== false && child !== true
    })
    .map((child) => {
      // Already a valid element
      if (is.object(child) && child.type) {
        return child
      }

      // Convert primitives to text elements
      if (
        is.string(child) ||
        typeof child === 'number'
      ) {
        return createTextElement(child)
      }

      // Warn about invalid children (skip in production)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Invalid child element:', child)
      }

      return createTextElement('')
    })
}

/**
 * Create a Ryunix element
 * @param {string|Function} type - Element type
 * @param {Object|null} props - Element props
 * @param {...any} children - Child elements
 * @returns {Object} Element object
 */
const createElement = (type, props, ...children) => {
  // Validate type (only in development)
  if (process.env.NODE_ENV !== 'production' && !type) {
    console.warn('createElement called with null/undefined type')
  }

  // Ensure props is an object
  const elementProps = props || {}

  // Process and validate children
  const processedChildren = processChildren(children)

  return {
    type,
    props: {
      ...elementProps,
      children: processedChildren,
    },
  }
}

/**
 * Create a Fragment component
 * @param {Object} props - Props containing children
 * @returns {Object} Fragment element
 */
const Fragment = (props = {}) => {
  const children = Array.isArray(props.children)
    ? props.children
    : props.children
      ? [props.children]
      : []

  return createElement(RYUNIX_TYPES.RYUNIX_FRAGMENT, {}, ...children)
}

/**
 * Clone an element with new props
 * @param {Object} element - Element to clone
 * @param {Object} props - New props to merge
 * @param {...any} children - New children (optional)
 * @returns {Object} Cloned element
 */
const cloneElement = (element, props = {}, ...children) => {
  if (!element || !is.object(element)) {
    throw new Error('cloneElement requires a valid element')
  }

  const newChildren = children.length > 0 ? children : element.props.children

  return createElement(
    element.type,
    { ...element.props, ...props },
    ...(Array.isArray(newChildren) ? newChildren : [newChildren])
  )
}

/**
 * Check if value is a valid element
 * @param {*} object - Value to check
 * @returns {boolean} Whether value is valid element
 */
const isValidElement = (object) => {
  return (
    is.object(object) &&
    object.type !== undefined &&
    object.props !== undefined &&
    Array.isArray(object.props.children)
  )
}

export {
  createElement,
  createTextElement,
  Fragment, 
  cloneElement,
  isValidElement
}