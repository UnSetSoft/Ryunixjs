import { createDom } from './dom'
import { reconcileChildren } from './reconciler'
import { RYUNIX_TYPES, getState, is } from '../utils/index'
import { createElement } from './createElement'

/**
 * Update function component fiber
 */
const updateFunctionComponent = (fiber) => {
  const state = getState()

  // Set up work-in-progress fiber
  state.wipFiber = fiber
  state.hookIndex = 0
  state.wipFiber.hooks = []

  try {
    // Call component function
    const children = [fiber.type(fiber.props)]

    // Store context info if Provider
    if (fiber.type._contextId && fiber.props.value !== undefined) {
      fiber._contextId = fiber.type._contextId
      fiber._contextValue = fiber.props.value
    }

    reconcileChildren(fiber, children)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error updating function component:', error)
    }
    // Render error boundary or null
    reconcileChildren(fiber, [])
  }
}

/**
 * Update host component fiber (DOM element)
 */
const updateHostComponent = (fiber) => {
  // Create DOM node if needed
  if (!fiber.dom && fiber.type !== RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    fiber.dom = createDom(fiber)
  }

  // Process children
  const children = Array.isArray(fiber.props.children)
    ? fiber.props.children.flat()
    : fiber.props.children
      ? [fiber.props.children]
      : []

  reconcileChildren(fiber, children)
}

/**
 * Image component with optimization support
 */
const Image = ({ src, optimization, ...props }) => {
  if (!src) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Image component requires src prop')
    }
    return null
  }

  // Apply optimization if enabled
  const finalSrc = optimization === 'true' || optimization === true
    ? optimizeImageUrl(src, props)
    : src

  return createElement('img', { ...props, src: finalSrc })
}

/**
 * Optimize image URL (placeholder implementation)
 */
const optimizeImageUrl = (src, props) => {
  // Check if localhost
  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

    if (isLocal) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Image optimization only works with full URLs, not localhost')
      }
      return src
    }
  }

  // Build optimization query
  const query = new URLSearchParams()
  if (props.width) query.set('width', props.width)
  if (props.height) query.set('height', props.height)
  if (props.quality) query.set('quality', props.quality)

  const extension = props.extension ? `@${props.extension}` : ''
  const isFullUrl = src.startsWith('http://') || src.startsWith('https://')

  if (!isFullUrl) {
    // Relative URL - prepend origin
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${src}`
    }
    return src
  }

  // Use optimization API
  const apiEndpoint = 'https://image.unsetsoft.com'
  return `${apiEndpoint}/image/${src}${extension}?${query.toString()}`
}

export { updateFunctionComponent, updateHostComponent, Image }