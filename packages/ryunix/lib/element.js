const TEXT_ELEMENT = "TEXT";

/**
 * This function creates a new element with the given type, configuration object, and children.
 * @param type - The type of the element being created (e.g. "div", "span", "h1", etc.).
 * @param configObject - The `configObject` parameter is an object that contains the properties and
 * values for the element's attributes. These attributes can include things like `className`, `id`,
 * `style`, and any other custom attributes that the user wants to add to the element.
 * @param args - The `args` parameter is a rest parameter that allows the function to accept any number
 * of additional arguments after the `configObject` parameter. These additional arguments are used as
 * children elements for the created element.
 * @returns An object with two properties: "type" and "props".
 */
export function createElement(type, configObject, ...args) {
  const props = Object.assign({}, configObject);
  const hasChildren = args.length > 0;
  const nodeChildren = hasChildren ? [...args] : [];
  props.children = nodeChildren.filter(Boolean).map(c => c instanceof Object ? c : createTextElement(c));
  return {
    type,
    props
  };
}

/**
 * The function creates a text element with a given node value and an empty array of children.
 * @param nodeValue - The value of the text node that will be created.
 * @returns The function `createTextElement` is returning an element object with a `nodeValue` property
 * and an empty `children` array. This element object represents a text node in the virtual DOM.
 */
function createTextElement(nodeValue) {
  return createElement(TEXT_ELEMENT, {
    nodeValue,
    children: []
  });
}
export { TEXT_ELEMENT };