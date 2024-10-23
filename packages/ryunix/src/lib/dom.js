import { isEvent, isGone, isNew, isProperty } from './effects'
import { RYUNIX_TYPES, STRINGS, reg, OLD_STRINGS } from '../utils/index'

/**
 * Creates a new DOM element based on the given fiber object and updates its properties.
 * 
 * @param fiber - The fiber object represents a node in the fiber tree and contains 
 *                information about the element type, props, and children.
 * @returns A newly created DOM element based on the fiber object.
 */
const createDom = (fiber) => {
  const dom = 
    fiber.type === RYUNIX_TYPES.TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  // Update the newly created DOM element with initial props
  updateDom(dom, {}, fiber.props)

  return dom
}

/**
 * Updates a DOM element by removing old properties and event listeners, 
 * and applying new properties and event listeners from the nextProps.
 * 
 * @param dom - The DOM element that needs to be updated.
 * @param prevProps - The previous properties of the DOM element.
 * @param nextProps - The new properties that should be applied to the DOM element.
 */
const updateDom = (dom, prevProps, nextProps) => {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => {
      dom[name] = ''
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (name === STRINGS.style || name === OLD_STRINGS.style) {
        DomStyle(dom, nextProps[STRINGS.style] || nextProps[OLD_STRINGS.style])
      } else if (name === STRINGS.className || name === OLD_STRINGS.className) {
        handleClassName(dom, prevProps, nextProps, name)
      } else {
        dom[name] = nextProps[name]
      }
    })

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

/**
 * Updates the DOM element's style by applying the provided styles.
 * 
 * @param dom - The DOM element that needs to be styled.
 * @param style - An object containing the styles to be applied.
 */
const DomStyle = (dom, style) => {
  dom.style = Object.keys(style).reduce((acc, styleName) => {
    const key = styleName.replace(reg, (v) => `-${v.toLowerCase()}`)
    acc += `${key}: ${style[styleName]};`
    return acc
  }, '')
}

/**
 * Handles updating the className or ryunix-class properties, ensuring
 * that the old class names are removed and the new ones are applied.
 * 
 * @param dom - The DOM element to be updated.
 * @param prevProps - The previous properties, including className.
 * @param nextProps - The new properties, including className.
 * @param name - The name of the class property (className or ryunix-class).
 */
const handleClassName = (dom, prevProps, nextProps, name) => {
  const classProp = name === STRINGS.className ? 'ryunix-class' : 'className'
  
  if (nextProps[classProp] === '') {
    throw new Error(`${classProp} cannot be empty.`)
  }

  // Remove old class names if they exist
  prevProps[classProp] &&
    dom.classList.remove(...prevProps[classProp].split(/\s+/))

  // Add new class names
  dom.classList.add(...nextProps[classProp].split(/\s+/))
}

export { DomStyle, createDom, updateDom }
