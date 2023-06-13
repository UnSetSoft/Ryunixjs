import { updateDomProperties } from "./dom-utils";
import { TEXT_ELEMENT } from "./element";

let rootInstance = null;
const ENOUGH_TIME = 1;
let workQueue = [];
let nextUnitOfWork = null;
const CLASS_COMPONENT = "class";
const HOST_ROOT = "root";
const HOST_COMPONENT = "host";
const PLACEMENT = "PLACEMENT"; // this is for a child that needs to be added
const DELETION = "DELETION"; //for a child that needs to be deleted.
const UPDATE = "UPDATE"; // for a child that needs to be updated. refresh the props
let pendingCommit = null;

/**
 * The function adds a task to a work queue and requests idle callback to perform the work.
 * @param task - The task parameter is a function that represents the work that needs to be done. It
 * will be added to the workQueue array, which is a queue of tasks waiting to be executed. The
 * requestIdleCallback function will be used to schedule the execution of the performWork function,
 * which will process the tasks
 */
function schedule(task) {
  workQueue.push(task);
  requestIdleCallback(performWork);
}

/**
 * This function performs work in a loop using requestIdleCallback and commits any pending changes.
 * @param deadline - The `deadline` parameter is a time value representing the deadline by which the
 * `performWork` function should finish its work. It is used to ensure that the function does not
 * exceed a certain amount of time and cause the browser to become unresponsive. The function will stop
 * working on the current task when
 */
function performWork(deadline) {
  if (!nextUnitOfWork) {
    initialUnitOfWork();
  }
  loopThroughWork(deadline);
  if (nextUnitOfWork || workQueue.length > 0) {
    requestIdleCallback(performWork);
  }

  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
}

/**
 * The function commits all the effects of a fiber and updates the root container fiber.
 * @param fiber - The fiber parameter is an object that represents a node in the fiber tree. It
 * contains information about the component, its state, props, and children. The fiber also has a
 * reference to its parent, child, and sibling fibers.
 */
function commitAllWork(fiber) {
  fiber.effects.forEach((f) => {
    commitWork(f);
  });

  fiber.stateNode._rootContainerFiber = fiber;
  nextUnitOfWork = null;
  pendingCommit = null;
}

/**
 * The function commits changes to the DOM based on the effect tag of the fiber.
 * @param fiber - A fiber is a lightweight unit of work that represents a component and its state
 * during the reconciliation process in React's virtual DOM. It contains information about the
 * component's type, props, state, and children, as well as pointers to its parent, child, and sibling
 * fibers.
 * @returns If the fiber tag is HOST_ROOT, nothing is being returned.
 */
function commitWork(fiber) {
  if (fiber.tag == HOST_ROOT) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (domParentFiber.tag == CLASS_COMPONENT) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.stateNode;
  if (fiber.effectTag == PLACEMENT && fiber.tag == HOST_COMPONENT) {
    domParent.appendChild(fiber.stateNode);
  } else if (fiber.effectTag == UPDATE) {
    updateDomProperties(fiber.stateNode, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag == DELETION) {
    commitDeletion(fiber, domParent);
  }
}

/**
 * The function removes a fiber and its corresponding DOM node from the parent DOM node.
 * @param fiber - The fiber is a data structure used by React to represent a component and its state
 * during the rendering process. It contains information about the component's type, props, children,
 * and other metadata.
 * @param domParent - The DOM element that is the parent of the component being deleted.
 * @returns The function does not explicitly return anything, but it will exit the function and return
 * control to the calling function when the condition `if (node == fiber)` is met.
 */
function commitDeletion(fiber, domParent) {
  let node = fiber;
  while (true) {
    if (node.tag == CLASS_COMPONENT) {
      node = node.child;
      continue;
    }
    domParent.removeChild(node.stateNode);
    while (node != fiber && !node.sibling) {
      node = node.parent;
    }
    if (node == fiber) {
      return;
    }
    node = node.sibling;
  }
}

/**
 * The function begins the work of updating a fiber either for a class component or a host component.
 * @param wipFiber - wipFiber is a fiber object that represents the work-in-progress (WIP) component
 * being worked on by the reconciler in a React application. It contains information about the
 * component's type, props, state, and children, as well as pointers to its parent, sibling, and child
 * fibers
 */
function beginWork(wipFiber) {
  if (wipFiber.tag == CLASS_COMPONENT) {
    updateClassFiber(wipFiber);
  } else {
    updateHostFiber(wipFiber);
  }
}

/**
 * This function updates the host fiber by creating a new DOM element and reconciling its children.
 * @param wipFiber - wipFiber is a work-in-progress fiber object that represents a component or element
 * in the virtual DOM tree. It contains information about the component's type, props, state, and
 * children. The function `updateHostFiber` uses this wipFiber object to update the corresponding DOM
 * element
 */
function updateHostFiber(wipFiber) {
  if (!wipFiber.stateNode) {
    wipFiber.stateNode = createDomElement(wipFiber);
  }
  const newChildElements = wipFiber.props.children;
  reconcileChildrenArray(wipFiber, newChildElements);
}

/**
 * This function updates the state and props of a fiber node and reconciles its child elements.
 * @param wipFiber - wipFiber is a work-in-progress fiber that represents a component in the fiber
 * tree. It contains information about the component's type, props, state, and children. The function
 * `updateClassFiber` updates the state and props of the component represented by the wipFiber.
 * @returns Nothing is being returned explicitly in this function. It either updates the instance and
 * child fibers or clones the child fibers and returns nothing.
 */
function updateClassFiber(wipFiber) {
  let instance = wipFiber.stateNode;
  if (instance == null) {
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if (wipFiber.props == instance.props && !wipFiber.partialState) {
    cloneChildFibers(wipFiber);
    return;
  }

  instance.props = wipFiber.props;
  instance.state = Object.assign({}, instance.state, wipFiber.partialState);
  wipFiber.partialState = null;

  const newChildElements = wipFiber.stateNode.render();
  reconcileChildrenArray(wipFiber, newChildElements);
}

/**
 * The function creates an instance of a component using the given fiber.
 * @param fiber - The "fiber" parameter is an object that represents a node in the fiber tree. It
 * contains information about the component type, props, children, and other metadata needed for
 * rendering and updating the component.
 * @returns The function `createInstance` returns an instance of the component class specified in the
 * `fiber` argument, with the props passed to it. The instance also has a reference to the `fiber`
 * object.
 */
function createInstance(fiber) {
  const instance = new fiber.type(fiber.props);
  instance.__fiber = fiber;
  return instance;
}

/**
 * This function creates a new DOM element based on the given fiber object.
 * @param fiber - The "fiber" parameter is an object that represents a node in the virtual DOM tree. It
 * contains information about the element's type, props, and children.
 * @returns The function `createDomElement` returns a DOM element created using the
 * `document.createElement` method. If the `fiber` object represents a text element, then a text node
 * is created using `document.createTextNode` method. The properties of the element are updated using
 * the `updateDomProperties` function.
 */
function createDomElement(fiber) {
  const isTextElement = fiber.type === TEXT_ELEMENT;
  const dom = isTextElement
    ? document.createTextNode("")
    : document.createElement(fiber.type);
  updateDomProperties(dom, [], fiber.props);
  return dom;
}

/**
 * This function performs work on a fiber and its children, completing each unit of work before moving
 * on to the next.
 * @param wipFiber - wipFiber stands for "work-in-progress fiber". In React, a fiber is a lightweight
 * representation of a component or element in the component tree. The wipFiber parameter represents
 * the current fiber that is being worked on by the reconciler during the rendering process. The
 * performUnitOfWork function performs
 * @returns the next unit of work to be performed, which is either the first child of the current fiber
 * (if it has one), or the next sibling of the current fiber (if it has one), or the parent of the
 * current fiber (if it has no more siblings).
 */
function performUnitOfWork(wipFiber) {
  beginWork(wipFiber);
  if (wipFiber.child) {
    return wipFiber.child;
  }

  let uow = wipFiber;
  while (uow) {
    completeWork(uow);

    if (uow.sibling) {
      return uow.sibling;
    }

    uow = uow.parent;
  }
}

/**
 * The function initializes a unit of work by dequeuing an update from a work queue and setting the
 * next unit of work based on the update's properties.
 * @returns The function does not have a return statement, so it returns undefined.
 */
function initialUnitOfWork() {
  const update = workQueue.shift();

  if (!update) {
    return;
  }

  if (update.partialState) {
    update.instance.__fiber.partialState = update.partialState;
  }

  const root =
    update.from === HOST_ROOT
      ? update.dom._rootContainerFiber
      : getRootNode(update.instance.__fiber);

  nextUnitOfWork = {
    tag: HOST_ROOT,
    stateNode: update.dom || root.stateNode,
    props: update.newProps || root.props,
    alternate: root,
  };
}

/**
 * The function returns the root node of a given fiber by traversing up the parent chain.
 * @param fiber - The "fiber" parameter is likely referring to a data structure used in React.js to
 * represent a component and its state. It is used in the function to traverse the component tree and
 * find the root node of the tree.
 * @returns The function `getRootNode` returns the root node of a given fiber by traversing up the
 * fiber tree until it reaches the topmost parent node.
 */
function getRootNode(fiber) {
  let node = fiber;
  while (node.parent) {
    node = node.parent;
  }
  return node;
}

/**
 * This function loops through work while there is still time remaining before the deadline.
 * @param deadline - The `deadline` parameter is an object that represents a deadline by which the
 * current task should be completed. It has a `timeRemaining()` method that returns the amount of time
 * left until the deadline, in milliseconds. The `loopThroughWork()` function uses this `deadline`
 * object to check if there
 */
function loopThroughWork(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

/**
 * The function creates an array of children elements, either from an array or a single element.
 * @param children - The parameter `children` is expected to be a value that represents the children of
 * a parent element in a web page. It can be an array of child elements or a single child element. If
 * `children` is not provided or is falsy, an empty array is returned.
 * @returns The function `createArrayOfChildren` is returning an array. If the `children` parameter is
 * falsy (e.g. `null`, `undefined`, `false`, `0`, `NaN`, or an empty string), it returns an empty
 * array. If `children` is already an array, it returns that array. Otherwise, it returns an array with
 * `children` as its only element.
 */
function createArrayOfChildren(children) {
  return !children ? [] : Array.isArray(children) ? children : [children];
}

/**
 * This function reconciles the children of a fiber node with a new array of child elements.
 * @param wipFiber - The work-in-progress fiber, which represents the current state of the component
 * being rendered or updated.
 * @param newChildElements - an array of new child elements to be reconciled with the existing children
 * of the current fiber (wipFiber).
 */
function reconcileChildrenArray(wipFiber, newChildElements) {
  const elements = createArrayOfChildren(newChildElements);

  let index = 0;

  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newFiber = null;
  while (index < elements.length || oldFiber != null) {
    const prevFiber = newFiber;

    const element = index < elements.length && elements[index];

    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        tag: oldFiber.tag,
        stateNode: oldFiber.stateNode,
        props: element.props,
        parent: wipFiber,
        alternate: oldFiber,
        partialState: oldFiber.partialState,
        effectTag: UPDATE,
      };
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        tag:
          typeof element.type === "string" ? HOST_COMPONENT : CLASS_COMPONENT,
        props: element.props,
        parent: wipFiber,
        effectTag: PLACEMENT,
      };
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = DELETION;
      wipFiber.effects = wipFiber.effects || [];

      wipFiber.effects.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index == 0) {
      wipFiber.child = newFiber;
    } else if (prevFiber && element) {
      prevFiber.sibling = newFiber;
    }

    index++;
  }
}

/**
 * The function clones child fibers from a parent fiber.
 * @param parentFiber - The parent fiber is an object that represents a component or element in the
 * React tree. It contains information about the component or element, such as its type, props, and
 * children. The function `cloneChildFibers` is used to clone the child fibers of the parent fiber.
 * @returns If the `oldFiber` does not have a child, then nothing is returned. Otherwise, a new set of
 * child fibers is created based on the `oldFiber` and attached to the `parentFiber`. No value is
 * explicitly returned from the function.
 */
function cloneChildFibers(parentFiber) {
  const oldFiber = parentFiber.alternate;

  if (!oldFiber.child) {
    return;
  }

  let oldChild = oldFiber.child;

  let prevChild = null;

  while (oldChild) {
    const newChild = {
      type: oldChild.type,
      tag: oldChild.tag,
      stateNode: oldChild.stateNode,
      props: oldChild.props,
      partialState: oldChild.partialState,
      alternate: oldChild,
      parent: parentFiber,
    };
    if (prevChild) {
      prevChild.sibling = newChild;
    } else {
      parentFiber.child = newChild;
    }
    prevChild = newChild;
    oldChild = oldChild.sibling;
  }
}

/**
 * The function completes work on a fiber and adds its effects to its parent's effects list or sets it
 * as the pending commit.
 * @param fiber - a fiber object representing a component or element in the React tree
 */
function completeWork(fiber) {
  if (fiber.tag == CLASS_COMPONENT) {
    fiber.stateNode.__fiber = fiber;
  }

  if (fiber.parent) {
    const childEffects = fiber.effects || [];

    const thisEffect = fiber.effectTag != null ? [fiber] : [];
    const parentEffects = fiber.parent.effects || [];

    fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
  } else {
    pendingCommit = fiber;
  }
}

/**
 * This function schedules an update for a class component with the given instance and partial state.
 * @param instance - The instance parameter refers to an instance of a class component in React. It is
 * used to identify which component needs to be updated with the new state.
 * @param partialState - partialState is an object that contains the updated state values for a
 * component. When a component's state changes, the partialState object is passed to the scheduleUpdate
 * function to schedule a re-render of the component with the updated state values.
 */
export function scheduleUpdate(instance, partialState) {
  schedule({
    from: CLASS_COMPONENT,
    instance: instance,
    partialState: partialState,
  });
}

/**
 * The `render` function takes in elements and a parent DOM node, and schedules a reconciliation
 * process to update the DOM with the new elements.
 * @param elements - an array of elements to be rendered in the parent DOM.
 * @param parentDom - parentDom is a reference to the DOM element where the rendered elements will be
 * appended as children. It is the container element for the rendered components.
 */
export function render(elements, parentDom) {
  workQueue.push({
    from: HOST_ROOT, // the root/parent fiber
    dom: parentDom, // document.getElementById("app") just a dom node where this fiber will be appended to as a child
    newProps: { children: elements },
  });
  requestIdleCallback(performWork);
}

/**
 * The function reconciles the differences between the previous and current instances of a component
 * and updates the DOM accordingly.
 * @param parentDom - The DOM element that serves as the parent container for the rendered component
 * tree.
 * @param instance - An object representing the current state of the component instance being
 * reconciled. It contains information about the component's rendered DOM node, its element type, and
 * its child instances. If this is the first time the component is being rendered, this parameter will
 * be null.
 * @param element - The element parameter represents the new element that needs to be rendered or
 * updated in the DOM. It contains information about the type of element (e.g. div, span, custom
 * component), its props (e.g. className, onClick), and its children (if any).
 * @returns an instance object that represents the updated state of the component after reconciling the
 * changes made to the virtual DOM.
 */
export function reconcile(parentDom, instance, element) {
  if (instance === null) {
    const newInstance = instantiate(element);
    parentDom.appendChild(newInstance.dom);
    return newInstance;
  } else if (element == null) {
    parentDom.removeChild(instance.dom);
    return null;
  } else if (instance.element.type !== element.type) {
    const newInstance = instantiate(element);
    parentDom.replaceChild(newInstance.dom, instance.dom);
    return newInstance;
  } else if (typeof element.type === "string") {
    instance.childInstances = reconcileChildren(instance, element);
    instance.element = element;
    return instance;
  } else {
    instance.publicInstance.props = element.props;
    const childElement = instance.publicInstance.render();
    const oldChildInstance = instance.childInstance;
    const childInstance = reconcile(parentDom, oldChildInstance, childElement);
    instance.dom = childInstance.dom;
    instance.childInstance = childInstance;
    instance.element = element;
    return instance;
  }
}

/**
 * The function creates an instance of a DOM element or a custom component element and returns it.
 * @param element - The element to be instantiated, which can be a DOM element or a custom component.
 * It contains information about the type of the element (string for DOM elements, function for custom
 * components) and its props (attributes and children).
 * @returns The function `instantiate` returns an instance object that contains a reference to the
 * corresponding DOM node, the element that was passed in, and an array of child instances. The exact
 * properties of the instance object depend on whether the element is a DOM element or a custom
 * component.
 */ function instantiate(element) {
  const { type, props } = element;
  const isDomElement = typeof type === "string";
  if (isDomElement) {
    const isTextElement = type === TEXT_ELEMENT;
    const dom = isTextElement
      ? document.createTextNode("")
      : document.createElement(type);
    updateDomProperties(dom, [], props);
    const childElements = props.children || [];
    const childInstances = childElements.map(instantiate);
    const childDoms = childInstances.map((childInstance) => childInstance.dom);
    childDoms.forEach((childDom) => dom.appendChild(childDom));
    const instance = {
      dom,
      element,
      childInstances,
    };
    return instance;
  } else {
    const instance = {};
    const publicInstance = createPublicInstance(element, instance);
    const childElement = publicInstance.render();
    const childInstance = instantiate(childElement);
    const dom = childInstance.dom;
    Object.assign(instance, {
      dom,
      element,
      childInstance,
      publicInstance,
    });
    return instance;
  }
}
/**
 * The function creates a public instance of a given element with its corresponding props and internal
 * instance.
 * @param element - An object that represents a React element, typically created using JSX syntax or
 * React.createElement() function.
 * @param internalInstance - The internalInstance parameter is an object that represents the internal
 * instance of a component. It may contain information such as the component's state, context, and
 * lifecycle methods. This parameter is used to associate the public instance of a component with its
 * internal instance.
 * @returns a newly created public instance of a given element type with its props.
 */
function createPublicInstance(element, internalInstance) {
  const { type, props } = element;
  const publicInstance = new type(props);
  publicInstance.__internalInstance = internalInstance;
  return publicInstance;
}

/**
 * This function reconciles the child instances of a component with its new child elements.
 * @param instance - an object representing the current instance of a component
 * @param element - The element is a React element that represents the new version of the component
 * being rendered. It contains information about the component's props and children.
 * @returns an array of new child instances that have been reconciled with the given parent instance
 * and child elements. The filter method is used to remove any falsy values from the array, such as
 * null or undefined.
 */
function reconcileChildren(instance, element) {
  const { dom, childInstances } = instance;
  const nextChildElements = element.props.children || [];

  const newChildInstances = [];

  const count = Math.max(childInstances.length, nextChildElements.length);

  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i];
    const childElement = nextChildElements[i];
    const newChildInstance = reconcile(dom, childInstance, childElement);
    newChildInstances.push(newChildInstance);
  }

  return newChildInstances.filter(Boolean);
}
