/**
 * JSX Runtime for Ryunix - Automatic JSX Runtime
 * This enables compatibility with modern JSX transformations
 */

import { createElement, Fragment } from '../dist/Ryunix.esm.js'

/**
 * Create JSX element (automatic runtime)
 * @param {string|Function} type - Element type
 * @param {Object} props - Element props
 * @param {string} key - Element key
 * @returns {Object} Ryunix element
 */
export function jsx(type, props, key) {
  const { children, ...restProps } = props || {}

  // If children is provided, pass it as rest parameter
  if (children !== undefined) {
    return createElement(
      type,
      key !== undefined ? { ...restProps, key } : restProps,
      ...(Array.isArray(children) ? children : [children]),
    )
  }

  return createElement(
    type,
    key !== undefined ? { ...restProps, key } : restProps,
  )
}

/**
 * Create JSX element with multiple children (automatic runtime)
 * @param {string|Function} type - Element type
 * @param {Object} props - Element props
 * @param {string} key - Element key
 * @returns {Object} Ryunix element
 */
export function jsxs(type, props, key) {
  return jsx(type, props, key)
}

/**
 * Create JSX development element (with additional debug info)
 * @param {string|Function} type - Element type
 * @param {Object} props - Element props
 * @param {string} key - Element key
 * @returns {Object} Ryunix element
 */
export function jsxDEV(type, props, key) {
  return jsx(type, props, key)
}

// Export Fragment for JSX runtime
export { Fragment }
