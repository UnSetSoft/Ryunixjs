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
const camelToKebab = (camelCase) => {
  return camelCase.replace(
    CAMEL_TO_KEBAB_REGEX,
    (match) => `-${match.toLowerCase()}`,
  )
}
const applyStyles = (dom, styleObj) => {
  if (!is.object(styleObj) || is.null(styleObj)) {
    dom.style.cssText = ''
    return
  }
  try {
    const cssText = Object.entries(styleObj)
      .filter(([_, value]) => value != null)
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
const applyClasses = (dom, prevClasses, nextClasses) => {
  if (!nextClasses || nextClasses.trim() === '') {
    if (prevClasses) {
      const oldClasses = prevClasses.split(/\s+/).filter(Boolean)
      dom.classList.remove(...oldClasses)
    }
    return
  }
  if (prevClasses) {
    const oldClasses = prevClasses.split(/\s+/).filter(Boolean)
    dom.classList.remove(...oldClasses)
  }
  const newClasses = nextClasses.split(/\s+/).filter(Boolean)
  if (newClasses.length > 0) {
    dom.classList.add(...newClasses)
  }
}
const createDom = (fiber) => {
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
      const hostType = fiber.type
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
    updateDom(dom, {}, fiber.props)
    return dom
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error creating DOM element:', error, fiber)
    }
    return null
  }
}
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
const updateDom = (dom, prevProps = {}, nextProps = {}) => {
  if (dom.nodeType === 3) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = String(nextProps.nodeValue ?? '')
    }
    return
  }
  const el = dom
  const domEl = el
  const handlerMap = domEl._ryunixHandlers
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((propKey) => {
      const eventType = propKey.toLowerCase().substring(2)
      try {
        const originalHandler = prevProps[propKey]
        const wrappedHandler =
          handlerMap?.get(originalHandler) || originalHandler
        el.removeEventListener(eventType, wrappedHandler)
        if (handlerMap) {
          handlerMap.delete(originalHandler)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Error removing event listener:', error)
        }
      }
    })
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((propKey) => {
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
        el[propKey] = ''
        el.removeAttribute(propKey)
      }
    })
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((propKey) => {
      try {
        if (propKey === STRINGS.STYLE || propKey === OLD_STRINGS.STYLE) {
          const styleValue = nextProps[propKey]
          applyStyles(el, styleValue)
        } else if (propKey === STRINGS.CLASS_NAME) {
          applyClasses(
            el,
            prevProps[STRINGS.CLASS_NAME],
            nextProps[STRINGS.CLASS_NAME],
          )
        } else if (propKey === OLD_STRINGS.CLASS_NAME) {
          applyClasses(
            el,
            prevProps[OLD_STRINGS.CLASS_NAME],
            nextProps[OLD_STRINGS.CLASS_NAME],
          )
        } else {
          if (propKey === 'value' || propKey === 'checked') {
            if (el[propKey] !== nextProps[propKey]) {
              el[propKey] = nextProps[propKey]
            }
          } else {
            const isSvgNode = el instanceof SVGElement
            if (isSvgNode) {
              const attrName = toSvgAttrName(propKey)
              const svgValidated = checkAttributeUri(
                attrName,
                nextProps[propKey],
              )
              el.setAttribute(attrName, svgValidated)
            } else {
              const attrVal = nextProps[propKey]
              const safeValue = checkAttributeUri(propKey, attrVal)
              el[propKey] = safeValue
              if (
                typeof attrVal !== 'object' &&
                typeof attrVal !== 'function'
              ) {
                el.setAttribute(propKey, safeValue)
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
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((propKey) => {
      const eventType = propKey.toLowerCase().substring(2)
      try {
        const handler = (e) => {
          runWithPriority(Priority.IMMEDIATE, () => nextProps[propKey](e))
        }
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
