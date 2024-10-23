import { RYUNIX_TYPES, STRINGS } from '../utils/index';

const Fragment = (props) => {
  return props.children;
};

/**
 * The function takes a set of child elements and flattens them into an array to ensure all children are handled properly.
 * @param children - The child elements, which can be of different types (array, object, primitive).
 * @param out - The array where the final children will be stored.
 * @returns An array with all the child elements.
 */
const childArray = (children, out = []) => {
  if (children == undefined || typeof children === STRINGS.boolean) {
    // Do nothing with undefined or boolean children
  } else if (Array.isArray(children)) {
    children.forEach((child) => childArray(child, out)); // Use forEach instead of some
  } else {
    out.push(children);
  }
  return out;
};

/**
 * The function clones a given element, allowing you to add or override its properties (props).
 * @param element - The element to be cloned.
 * @param props - The new or updated properties for the cloned element.
 * @returns A new element object with the updated properties.
 */
const cloneElement = (element, props) => {
  return {
    ...element,
    props: {
      ...element.props,
      ...props,
    },
  };
};

/**
 * The function creates a new element with a given type, properties, and children.
 * @param type - The type of element to create (div, span, etc.).
 * @param props - The properties of the element.
 * @param children - The child elements of the new element.
 * @returns An object representing the created element.
 */
const createElement = (type, props, ...children) => {
  children = childArray(children, []);
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === STRINGS.object ? child : createTextElement(child)
      ),
    },
  };
};

/**
 * The function creates a text element from a given text value.
 * @param text - The text content to create the element.
 * @returns An object representing a text element.
 */
const createTextElement = (text) => {
  return {
    type: RYUNIX_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: [], // Text elements don't have children.
    },
  };
};

export { createElement, createTextElement, Fragment, cloneElement };
