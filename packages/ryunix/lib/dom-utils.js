/**
 * This function updates the properties and event listeners of a DOM element based on the previous and
 * next props passed as arguments.
 * @param dom - The DOM element that needs to be updated with new properties.
 * @param prevProps - An object representing the previous properties of a DOM element.
 * @param nextProps - An object containing the new props that need to be updated on the DOM element.
 */
export function updateDomProperties(dom, prevProps, nextProps) {
  const isEvent = name => name.startsWith("on");
  const isAttribute = name => !isEvent(name) && name != "children";
  Object.keys(prevProps).filter(isEvent).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.removeEventListener(eventType, prevProps[name]);
  });
  Object.keys(prevProps).filter(isAttribute).forEach(name => {
    dom[name] = null;
  });
  Object.keys(nextProps).filter(isAttribute).forEach(name => {
    dom[name] = nextProps[name];
  });
  Object.keys(nextProps).filter(isEvent).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, nextProps[name]);
  });
}