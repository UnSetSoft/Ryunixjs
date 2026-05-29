import { isEvent, isGone, isNew, isProperty } from './effects.js'
import {
  RYUNIX_TYPES,
  STRINGS,
  OLD_STRINGS,
  CAMEL_TO_KEBAB_REGEX,
  is,
} from '../../utils/index.js'
import { toSvgAttrName } from '../../utils/svgAttributes.js'
import { Priority, runWithPriority } from './priority.js'
import type { RyunixDomElement, RyunixFiber } from '../../types/internal.js'

/**
 * Convert camelCase to kebab-case for CSS properties
 */
const camelToKebab = (camelCase: string): string => {
  return camelCase.replace(
    CAMEL_TO_KEBAB_REGEX,
    (match: string) => `-${match.toLowerCase()}`,
  )
}

/**
 * Apply styles to DOM element
 */
const applyStyles = (dom: HTMLElement, styleObj: Record<string, unknown>) => {
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

/**
 * Apply CSS classes to DOM element
 */
const applyClasses = (
  dom: HTMLElement,
  prevClasses: string,
  nextClasses: string,
) => {
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

/**
 * Create a DOM element from fiber
 */
const createDom = (
  fiber: RyunixFiber,
): HTMLElement | SVGElement | Text | null => {
  if (
    fiber.type === RYUNIX_TYPES.RYUNIX_FRAGMENT ||
    fiber.type === RYUNIX_TYPES.RYUNIX_CONTEXT ||
    fiber.type === Symbol.for('ryunix.portal')
  ) {
    return null
  }

  let dom: HTMLElement | SVGElement | Text | null

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

const checkAttributeUri = (attrName: string, value: unknown): unknown => {
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
 */
const updateDom = (
  dom: HTMLElement | SVGElement | Text,
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
  const domEl = el as RyunixDomElement
  const handlerMap = domEl._ryunixHandlers
  const elRecord = el as unknown as Record<string, unknown>

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
        elRecord[propKey] = ''
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
          applyStyles(el, styleValue as Record<string, unknown>)
        } else if (propKey === STRINGS.CLASS_NAME) {
          applyClasses(
            el,
            prevProps[STRINGS.CLASS_NAME] as string,
            nextProps[STRINGS.CLASS_NAME] as string,
          )
        } else if (propKey === OLD_STRINGS.CLASS_NAME) {
          applyClasses(
            el,
            prevProps[OLD_STRINGS.CLASS_NAME] as string,
            nextProps[OLD_STRINGS.CLASS_NAME] as string,
          )
        } else {
          if (propKey === 'value' || propKey === 'checked') {
            if (elRecord[propKey] !== nextProps[propKey]) {
              elRecord[propKey] = nextProps[propKey]
            }
          } else {
            const isSvgNode = el instanceof SVGElement
            if (isSvgNode) {
              const attrName = toSvgAttrName(propKey)
              const svgValidated = checkAttributeUri(
                attrName,
                nextProps[propKey],
              )
              el.setAttribute(attrName, String(svgValidated))
            } else {
              const attrVal = nextProps[propKey]
              const safeValue = checkAttributeUri(propKey, attrVal)

              elRecord[propKey] = safeValue
              if (
                typeof attrVal !== 'object' &&
                typeof attrVal !== 'function'
              ) {
                el.setAttribute(propKey, String(safeValue))
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
        const handler = (e: Event) => {
          runWithPriority(Priority.IMMEDIATE, () =>
            (nextProps[propKey] as (e: Event) => void)(e),
          )
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

/**
 * Clear all children from a DOM element
 */
const clearContainer = (container: HTMLElement) => {
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
