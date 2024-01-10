import { isEvent, isGone, isNew, isProperty } from './effects'
import { RYUNIX_TYPES, STRINGS, reg, OLD_STRINGS } from '../utils/index'

/**
 * The function creates a new DOM element based on the given fiber object and updates its properties.
 * @param fiber - The fiber parameter is an object that represents a node in the fiber tree. It
 * contains information about the element type, props, and children of the node.
 * @returns The `createDom` function returns a newly created DOM element based on the `fiber` object
 * passed as an argument. If the `fiber` object represents a text element, a text node is created using
 * `document.createTextNode("")`. Otherwise, a new element is created using
 * `document.createElement(fiber.type)`. The function then calls the `updateDom` function to update the
 * properties of the newly created
 */
const createDom = (fiber) => {
  const dom =
    fiber.type == RYUNIX_TYPES.TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

/**
 * The function updates the DOM by removing old event listeners and properties, and adding new ones
 * based on the previous and next props.
 * @param dom - The DOM element that needs to be updated with new props.
 * @param prevProps - An object representing the previous props (properties) of a DOM element.
 * @param nextProps - An object containing the new props that need to be updated in the DOM.
 */
const updateDom = (dom, prevProps, nextProps) => {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => {
      dom[name] = ''
    })

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (name === STRINGS.style) {
        DomStyle(dom, nextProps['ryunix-style'])
      } else if (name === OLD_STRINGS.style) {
        DomStyle(dom, nextProps.style)
      } else if (name === STRINGS.className) {
        if (nextProps['ryunix-class'] === '') {
          throw new Error('data-class cannot be empty.')
        }

        prevProps['ryunix-class'] &&
          dom.classList.remove(...prevProps['ryunix-class'].split(/\s+/))
        dom.classList.add(...nextProps['ryunix-class'].split(/\s+/))
      } else if (name === OLD_STRINGS.className) {
        if (nextProps.className === '') {
          throw new Error('className cannot be empty.')
        }

        prevProps.className &&
          dom.classList.remove(...prevProps.className.split(/\s+/))
        dom.classList.add(...nextProps.className.split(/\s+/))
      } else {
        dom[name] = nextProps[name]
      }
    })

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

const DomStyle = (dom, style) => {
  dom.style = Object.keys(style).reduce((acc, styleName) => {
    const key = styleName.replace(reg, function (v) {
      return '-' + v.toLowerCase()
    })
    acc += `${key}: ${style[styleName]};`
    return acc
  }, '')
}

export { DomStyle, createDom, updateDom }
