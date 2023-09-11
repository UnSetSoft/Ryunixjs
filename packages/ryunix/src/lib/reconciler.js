import { EFFECT_TAGS, vars } from "../utils/index";

/**
 * This function reconciles the children of a fiber node with a new set of elements, creating new
 * fibers for new elements, updating existing fibers for elements with the same type, and marking old
 * fibers for deletion if they are not present in the new set of elements.
 * @param wipFiber - A work-in-progress fiber object representing a component or element in the virtual
 * DOM tree.
 * @param elements - an array of elements representing the new children to be rendered in the current
 * fiber's subtree
 */
const reconcileChildren = (wipFiber, elements) => {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECT_TAGS.UPDATE,
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: EFFECT_TAGS.PLACEMENT,
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = EFFECT_TAGS.DELETION;
      vars.deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};
export { reconcileChildren };
