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
 * @typedef {import('../types/internal.js').RyunixFiber} RyunixFiber
 * @typedef {import('../types/internal.js').RyunixDomElement} RyunixDomElement
 */

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
 * @param {RyunixFiber} fiber - Fiber node
 * @returns {HTMLElement | SVGElement | Text | null}
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
      const hostType = /** @type {string} */ fiber.type
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
      ].includes(hostType)

      if (isSvg) {
        dom = document.createElementNS('http://www.w3.org/2000/svg', hostType)
      } else {
        dom = document.createElement(hostType)
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

    updateDom(
      /** @type {HTMLElement | Text} */ /** @type {HTMLElement | SVGElement | Text} */ dom,
      {},
      fiber.props,
    )
    return dom
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error creating DOM element:', error, fiber)
    }
    return null
  }
}

/**
 * @param {string} attrName
 * @param {unknown} value
 * @returns {unknown}
 */
/** @type {(attrName: string, value: unknown) => unknown} */
const checkAttributeUri = (attrName, value) => {
  if (typeof value !== 'string') return value
  const attr = attrName.toLowerCase()
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
      console.warn(
        `[Ryunix Security] Blocked dangerous ${attrName} URI: ${value}`,
      )
    }
    return 'javascript:void(0)'
  }

  return value
}

export const validateUri = checkAttributeUri

/**
 * Update DOM element with new props
 * @param {HTMLElement|Text} dom - DOM element
 * @param {Record<string, unknown>} [prevProps] - Previous props
 * @param {Record<string, unknown>} [nextProps] - Next props
 */
const updateDom = (
  dom: HTMLElement | Text,
  prevProps: Record<string, unknown> = {},
  nextProps: Record<string, unknown> = {},
) => {
  if (dom.nodeType === 3) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = String(nextProps.nodeValue ?? '')
    }
    return
  }
  const el = dom as HTMLElement
  const domEl = el as import('../types/internal.js').RyunixDomElement
  const handlerMap = domEl._ryunixHandlers
  // Remove old event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((propKey) => {
      const eventType = propKey.toLowerCase().substring(2)
      try {
        const originalHandler = prevProps[propKey]
        const wrappedHandler =
          handlerMap?.get(originalHandler) || originalHandler
        el.removeEventListener(eventType, wrappedHandler as EventListener)
        if (handlerMap) {
          handlerMap.delete(originalHandler)
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
    .forEach((propKey) => {
      // Skip special properties
      if (
        propKey === STRINGS.STYLE ||
        propKey === OLD_STRINGS.STYLE ||
        propKey === STRINGS.CLASS_NAME ||
        propKey === OLD_STRINGS.CLASS_NAME
      ) {
        return
      }
      if (el instanceof SVGElement) {
        const attrName = toSvgAttrName(propKey)
        el.removeAttribute(attrName)
      } else {
        /** @type {Record<string, unknown>} */ /** @type {unknown} */ el[
          propKey
        ] = ''
        el.removeAttribute(propKey)
      }
    })

  // Set new properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((propKey) => {
      try {
        // Handle style properties
        if (propKey === STRINGS.STYLE || propKey === OLD_STRINGS.STYLE) {
          const styleValue = nextProps[propKey]
          applyStyles(el, /** @type {Record<string, unknown>} */ styleValue)
        }
        // Handle className properties
        else if (propKey === STRINGS.CLASS_NAME) {
          applyClasses(
            el,
            /** @type {string} */ prevProps[STRINGS.CLASS_NAME],
            /** @type {string} */ nextProps[STRINGS.CLASS_NAME],
          )
        } else if (propKey === OLD_STRINGS.CLASS_NAME) {
          applyClasses(
            el,
            /** @type {string} */ prevProps[OLD_STRINGS.CLASS_NAME],
            /** @type {string} */ nextProps[OLD_STRINGS.CLASS_NAME],
          )
        }
        // Handle other properties
        else {
          // Special handling for value and checked (controlled components)
          if (propKey === 'value' || propKey === 'checked') {
            if (
              /** @type {Record<string, unknown>} */ /** @type {unknown} */ el[
                propKey
              ] !== nextProps[propKey]
            ) {
              /** @type {Record<string, unknown>} */ /** @type {unknown} */ el[
                propKey
              ] = nextProps[propKey]
            }
          } else {
            const isSvgNode = el instanceof SVGElement
            if (isSvgNode) {
              const attrName = toSvgAttrName(propKey)
              /** @type {unknown} */
              const svgValidated = checkAttributeUri(
                attrName,
                nextProps[propKey],
              )
              // viewBox is case sensitive, we respect the camelCase for it.
              el.setAttribute(attrName, /** @type {string} */ svgValidated)
            } else {
              const attrVal = nextProps[propKey]
              /** @type {unknown} */
              const safeValue = checkAttributeUri(propKey, attrVal)

              /** @type {Record<string, unknown>} */ /** @type {unknown} */ el[
                propKey
              ] = safeValue
              // Best effort: set html attributes if it's not a primitive component property
              if (
                typeof attrVal !== 'object' &&
                typeof attrVal !== 'function'
              ) {
                el.setAttribute(propKey, /** @type {string} */ safeValue)
              }
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Error setting property ${propKey}:`, error)
        }
      }
    })

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((propKey) => {
      const eventType = propKey.toLowerCase().substring(2)
      try {
        const handler = (e: Event) => {
          runWithPriority(Priority.IMMEDIATE, () =>
            (nextProps[propKey] as (e: Event) => void)(e),
          )
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
        if (!domEl._ryunixHandlers) {
          domEl._ryunixHandlers = new Map()
        }
        domEl._ryunixHandlers.set(nextProps[propKey], handler)

        el.addEventListener(eventType, handler)
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
