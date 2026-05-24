import { isEvent, isGone, isNew, isProperty } from './effects.js'
import {
  RYUNIX_TYPES,
  STRINGS,
  OLD_STRINGS,
  CAMEL_TO_KEBAB_REGEX,
  is,
} from '../utils/index.js'
import { toSvgAttrName } from '../utils/svgAttributes.js'
import { Priority, runWithPriority } from './priority.js'

/**
 * Convert camelCase to kebab-case for CSS properties
 * @param {string} camelCase - CamelCase string
 * @returns {string} Kebab-case string
 */
const camelToKebab = (camelCase) => {
  return camelCase.replace(
    CAMEL_TO_KEBAB_REGEX,
    (match) => `-${match.toLowerCase()}`,
  )
}

/**
 * Apply styles to DOM element
 * @param {HTMLElement} dom - DOM element
 * @param {Object} styleObj - Style object
 */
const applyStyles = (dom, styleObj) => {
  if (!is.object(styleObj) || is.null(styleObj)) {
    dom.style.cssText = ''
    return
  }

  try {
    const cssText = Object.entries(styleObj)
      .filter(([_, value]) => value != null) // Filter out null/undefined
      .map(([key, value]) => {
        const kebabKey = camelToKebab(key)
        return `${kebabKey}: ${value}`
      })
      .join('; ')

    dom.style.cssText = cssText
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error applying styles:', error)
    }
  }
}

/**
 * Apply CSS classes to DOM element
 * @param {HTMLElement} dom - DOM element
 * @param {string} prevClasses - Previous class string
 * @param {string} nextClasses - Next class string
 */
const applyClasses = (dom, prevClasses, nextClasses) => {
  // Allow empty/undefined - just remove classes
  if (!nextClasses || nextClasses.trim() === '') {
    if (prevClasses) {
      const oldClasses = prevClasses.split(/\s+/).filter(Boolean)
      dom.classList.remove(...oldClasses)
    }
    return
  }

  // Remove old classes
  if (prevClasses) {
    const oldClasses = prevClasses.split(/\s+/).filter(Boolean)
    dom.classList.remove(...oldClasses)
  }

  // Add new classes
  const newClasses = nextClasses.split(/\s+/).filter(Boolean)
  if (newClasses.length > 0) {
    dom.classList.add(...newClasses)
  }
}

/**
 * Create a DOM element from fiber
 * @param {Object} fiber - Fiber node
 * @returns {HTMLElement|Text|null}
 */
const createDom = (fiber) => {
  // Fragments and Context Providers don't create real DOM nodes
  if (
    fiber.type === RYUNIX_TYPES.RYUNIX_FRAGMENT ||
    fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT ||
    fiber.type === Symbol.for('ryunix.portal')
  ) {
    return null
  }

  let dom

  try {
    if (fiber.type === RYUNIX_TYPES.TEXT_ELEMENT) {
      dom = document.createTextNode('')
    } else if (is.string(fiber.type)) {
      const isSvg = [
        'svg',
        'path',
        'g',
        'circle',
        'polygon',
        'rect',
        'line',
        'polyline',
        'ellipse',
        'text',
        'tspan',
        'defs',
        'use',
        'symbol',
        'mask',
        'clipPath',
        'linearGradient',
        'radialGradient',
        'stop',
        'filter',
        'feGaussianBlur',
        'feOffset',
        'feMerge',
        'feMergeNode',
        'feBlend',
        'feColorMatrix',
        'feComposite',
        'foreignObject',
        'image',
        'marker',
        'pattern',
        'textPath',
      ].includes(fiber.type)

      if (isSvg) {
        dom = document.createElementNS('http://www.w3.org/2000/svg', fiber.type)
      } else {
        dom = document.createElement(fiber.type)
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Attempted to create DOM for non-host component:',
          fiber.type,
        )
      }
      return null
    }

    updateDom(dom, {}, fiber.props)
    return dom
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error creating DOM element:', error, fiber)
    }
    return null
  }
}

export const validateUri = (name, value) => {
  if (typeof value !== 'string') return value
  const attr = name.toLowerCase()
  if (
    attr !== 'href' &&
    attr !== 'src' &&
    attr !== 'action' &&
    attr !== 'formaction'
  ) {
    return value
  }

  const normalized = value.replace(/\s+/g, '').toLowerCase()
  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:')
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Ryunix Security] Blocked dangerous ${name} URI: ${value}`)
    }
    return 'javascript:void(0)'
  }

  return value
}

/**
 * Update DOM element with new props
 * @param {HTMLElement|Text} dom - DOM element
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 */
const updateDom = (dom, prevProps = {}, nextProps = {}) => {
  if (dom.nodeType === 3) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = nextProps.nodeValue
    }
    return
  }
  // Remove old event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      try {
        const originalHandler = prevProps[name]
        const wrappedHandler =
          dom._ryunixHandlers?.get(originalHandler) || originalHandler
        dom.removeEventListener(eventType, wrappedHandler)
        if (dom._ryunixHandlers) {
          dom._ryunixHandlers.delete(originalHandler)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Error removing event listener:', error)
        }
      }
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => {
      // Skip special properties
      if (
        [
          STRINGS.STYLE,
          OLD_STRINGS.STYLE,
          STRINGS.CLASS_NAME,
          OLD_STRINGS.CLASS_NAME,
        ].includes(name)
      ) {
        return
      }
      if (dom instanceof SVGElement) {
        const attrName = toSvgAttrName(name)
        dom.removeAttribute(attrName)
      } else {
        dom[name] = ''
        dom.removeAttribute(name)
      }
    })

  // Set new properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      try {
        // Handle style properties
        if (name === STRINGS.STYLE || name === OLD_STRINGS.STYLE) {
          const styleValue = nextProps[name]
          applyStyles(dom, styleValue)
        }
        // Handle className properties
        else if (name === STRINGS.CLASS_NAME) {
          applyClasses(
            dom,
            prevProps[STRINGS.CLASS_NAME],
            nextProps[STRINGS.CLASS_NAME],
          )
        } else if (name === OLD_STRINGS.CLASS_NAME) {
          applyClasses(
            dom,
            prevProps[OLD_STRINGS.CLASS_NAME],
            nextProps[OLD_STRINGS.CLASS_NAME],
          )
        }
        // Handle other properties
        else {
          // Special handling for value and checked (controlled components)
          if (name === 'value' || name === 'checked') {
            if (dom[name] !== nextProps[name]) {
              dom[name] = nextProps[name]
            }
          } else {
            const isSvgNode = dom instanceof SVGElement
            if (isSvgNode) {
              const attrName = toSvgAttrName(name)
              const validatedValue = validateUri(attrName, nextProps[name])
              // viewBox is case sensitive, we respect the camelCase for it.
              dom.setAttribute(attrName, validatedValue)
            } else {
              const validatedValue = validateUri(name, nextProps[name])
              dom[name] = validatedValue
              // Best effort: set html attributes if it's not a primitive component property
              if (
                typeof nextProps[name] !== 'object' &&
                typeof nextProps[name] !== 'function'
              ) {
                dom.setAttribute(name, validatedValue)
              }
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Error setting property ${name}:`, error)
        }
      }
    })

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      try {
        const handler = (e) => {
          runWithPriority(Priority.IMMEDIATE, () => nextProps[name](e))
        }
        // Store the wrapped handler so it can be removed later
        // Note: For simplicity, we could also just wrap it on the fly,
        // but we need the exact reference for removeEventListener.
        // Actually, the current removeDom logic uses prevProps[name],
        // which won't work if we wrap it here and don't store it.
        // Wait, the current removeEventListener call in dom.js:177 is:
        // dom.removeEventListener(eventType, prevProps[name])
        // If we wrap it, we MUST store the wrapper.

        // Let's use a weakMap or a property on the DOM node to store the wrappers.
        if (!dom._ryunixHandlers) dom._ryunixHandlers = new Map()
        dom._ryunixHandlers.set(nextProps[name], handler)

        dom.addEventListener(eventType, handler)
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Error adding event listener:', error)
        }
      }
    })
}

/**
 * Clear all children from a DOM element
 * @param {HTMLElement} container - DOM element to clear
 */
const clearContainer = (container) => {
  if (!container) return
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

export {
  createDom,
  updateDom,
  applyStyles,
  applyClasses,
  camelToKebab,
  clearContainer,
}
