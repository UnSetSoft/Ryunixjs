import { updateDom } from "./dom";
import { cancelEffects, runEffects } from "./effects";
import { EFFECT_TAGS, vars } from "../utils/index";

/**
 * The function commits changes made to the virtual DOM to the actual DOM.
 */
const commitRoot = () => {
  vars.deletions.forEach(commitWork);
  commitWork(vars.wipRoot.child);
  vars.currentRoot = vars.wipRoot;
  vars.wipRoot = null;
};

/**
 * The function commits changes made to the DOM based on the effect tag of the fiber.
 * @param fiber - A fiber is a unit of work in Ryunix's reconciliation process. It represents a
 * component and its state at a particular point in time. The `commitWork` function takes a fiber as a
 * parameter to commit the changes made during the reconciliation process to the actual DOM.
 * @returns The function does not return anything, it performs side effects by manipulating the DOM.
 */
const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === EFFECT_TAGS.PLACEMENT) {
    if (fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    }
    runEffects(fiber);
  } else if (fiber.effectTag === EFFECT_TAGS.UPDATE) {
    cancelEffects(fiber);
    if (fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
    runEffects(fiber);
  } else if (fiber.effectTag === EFFECT_TAGS.DELETION) {
    cancelEffects(fiber);
    commitDeletion(fiber, domParent);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

/**
 * The function removes a fiber's corresponding DOM node from its parent node or recursively removes
 * its child's DOM node until it finds a node to remove.
 * @param fiber - a fiber node in a fiber tree, which represents a component or an element in the Ryunix
 * application.
 * @param domParent - The parent DOM element from which the fiber's DOM element needs to be removed.
 */
const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
};

export { commitDeletion, commitWork, commitRoot };
