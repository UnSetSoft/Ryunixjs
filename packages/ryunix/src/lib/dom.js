import { isEvent, isGone, isNew, isProperty } from './effects'
import { RYUNIX_TYPES, STRINGS, OLD_STRINGS, CAMEL_TO_KEBAB_REGEX, is } from '../utils/index'

/**
 * Convert camelCase to kebab-case for CSS properties
 * @param {string} camelCase - CamelCase string
 * @returns {string} Kebab-case string
 */
const camelToKebab = (camelCase) => {
  return camelCase.replace(CAMEL_TO_KEBAB_REGEX, (match) => `-${match.toLowerCase()}`)
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
  if (!nextClasses) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('className/ryunix-class cannot be empty')
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
  // Fragments don't create real DOM nodes
  if (fiber.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    return null
  }

  let dom

  try {
    if (fiber.type === RYUNIX_TYPES.TEXT_ELEMENT) {
      dom = document.createTextNode('')
    } else if (is.string(fiber.type)) {
      dom = document.createElement(fiber.type)
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Attempted to create DOM for non-host component:', fiber.type)
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

/**
 * Update DOM element with new props
 * @param {HTMLElement|Text} dom - DOM element
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 */
const updateDom = (dom, prevProps = {}, nextProps = {}) => {
// Remove old event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      try {
        dom.removeEventListener(eventType, prevProps[name])
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
      if ([STRINGS.STYLE, OLD_STRINGS.STYLE, STRINGS.CLASS_NAME, OLD_STRINGS.CLASS_NAME].includes(name)) {
        return
      }
      dom[name] = ''
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
          applyClasses(dom, prevProps[STRINGS.CLASS_NAME], nextProps[STRINGS.CLASS_NAME])
        }
        else if (name === OLD_STRINGS.CLASS_NAME) {
          applyClasses(dom, prevProps[OLD_STRINGS.CLASS_NAME], nextProps[OLD_STRINGS.CLASS_NAME])
        }
        // Handle other properties
        else {
          // Special handling for value and checked (controlled components)
          if (name === 'value' || name === 'checked') {
            if (dom[name] !== nextProps[name]) {
              dom[name] = nextProps[name]
            }
          } else {
            dom[name] = nextProps[name]
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
        dom.addEventListener(eventType, nextProps[name])
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Error adding event listener:', error)
        }
      }
    })
}

/**
 * Remove DOM element safely
 * @param {HTMLElement} dom - DOM element to remove
 */
const removeDom = (dom) => {
  try {
    if (dom && dom.parentNode) {
      dom.parentNode.removeChild(dom)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error removing DOM element:', error)
    }
  }
}

export {
  createDom,
  updateDom,
  applyStyles,
  applyClasses,
  removeDom,
  camelToKebab
}