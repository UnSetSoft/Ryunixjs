/**
 * The function creates a new element with the given type, props, and children.
 * @param type - The type of the element to be created, such as "div", "span", "h1", etc.
 * @param props - The `props` parameter is an object that contains the properties or attributes of the
 * element being created. These properties can include things like `className`, `id`, `style`, and any
 * other custom attributes that the user wants to add to the element. The `props` object is spread
 * using the spread
 * @param children - The `children` parameter is a rest parameter that allows the function to accept
 * any number of arguments after the `props` parameter. These arguments will be treated as children
 * elements of the created element. The `map` function is used to iterate over each child and create a
 * new element if it is not
 * @returns A JavaScript object with a `type` property and a `props` property. The `type` property is
 * set to the `type` argument passed into the function, and the `props` property is an object that
 * includes any additional properties passed in the `props` argument, as well as a `children` property
 * that is an array of any child elements passed in the `...children` argument
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map((child) =>
          typeof child === "object" ? child : createTextElement(child)
        ),
    },
  };
}

/**
 * The function creates a text element with a given text value.
 * @param text - The text content that will be used to create a new text element.
 * @returns A JavaScript object with a `type` property set to `"TEXT_ELEMENT"` and a `props` property
 * that contains a `nodeValue` property set to the `text` parameter and an empty `children` array.
 */
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

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
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (next) => (key) => !(key in next);

/**
 * The function updates the DOM by removing old event listeners and properties, and adding new ones
 * based on the previous and next props.
 * @param dom - The DOM element that needs to be updated with new props.
 * @param prevProps - An object representing the previous props (properties) of a DOM element.
 * @param nextProps - An object containing the new props that need to be updated in the DOM.
 */
function updateDom(dom, prevProps, nextProps) {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (name === "style") {
        DomStyle(dom, nextProps.style);
      } else if (name === "className") {
        prevProps.className &&
          dom.classList.remove(...prevProps.className.split(/\s+/));
        dom.classList.add(...nextProps.className.split(/\s+/));
      } else {
        dom[name] = nextProps[name];
      }
    });

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

const reg = /[A-Z]/g;
function DomStyle(dom, style) {
  dom.style = Object.keys(style).reduce((acc, styleName) => {
    const key = styleName.replace(reg, function (v) {
      return "-" + v.toLowerCase();
    });
    acc += `${key}: ${style[styleName]};`;
    return acc;
  }, "");
}

/**
 * The function commits changes made to the virtual DOM to the actual DOM.
 */
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

/**
 * The function cancels all effect hooks in a given fiber.
 * @param fiber - The "fiber" parameter is likely referring to a data structure used in React.js to
 * represent a component and its state. It contains information about the component's props, state, and
 * children, as well as metadata used by React to manage updates and rendering. The function
 * "cancelEffects" is likely intended
 */
function cancelEffects(fiber) {
  if (fiber.hooks) {
    fiber.hooks
      .filter((hook) => hook.tag === "effect" && hook.cancel)
      .forEach((effectHook) => {
        effectHook.cancel();
      });
  }
}

/**
 * The function runs all effect hooks in a given fiber.
 * @param fiber - The "fiber" parameter is likely referring to a data structure used in the
 * implementation of a fiber-based reconciliation algorithm, such as the one used in React. A fiber
 * represents a unit of work that needs to be performed by the reconciliation algorithm, and it
 * contains information about a component and its children, as
 */
function runEffects(fiber) {
  if (fiber.hooks) {
    fiber.hooks
      .filter((hook) => hook.tag === "effect" && hook.effect)
      .forEach((effectHook) => {
        effectHook.cancel = effectHook.effect();
      });
  }
}

/**
 * The function commits changes made to the DOM based on the effect tag of the fiber.
 * @param fiber - A fiber is a unit of work in Ryunix's reconciliation process. It represents a
 * component and its state at a particular point in time. The `commitWork` function takes a fiber as a
 * parameter to commit the changes made during the reconciliation process to the actual DOM.
 * @returns The function does not return anything, it performs side effects by manipulating the DOM.
 */
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT") {
    if (fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    }
    runEffects(fiber);
  } else if (fiber.effectTag === "UPDATE") {
    cancelEffects(fiber);
    if (fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
    runEffects(fiber);
  } else if (fiber.effectTag === "DELETION") {
    cancelEffects(fiber);
    commitDeletion(fiber, domParent);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * The function removes a fiber's corresponding DOM node from its parent node or recursively removes
 * its child's DOM node until it finds a node to remove.
 * @param fiber - a fiber node in a fiber tree, which represents a component or an element in the Ryunix
 * application.
 * @param domParent - The parent DOM element from which the fiber's DOM element needs to be removed.
 */
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

let containerRoot = null;

/**
 * @deprecated use Ryunix.init(root) instead.
 *
 * @description The function creates a root container for a web application.
 * @example Ryunix.createRoot(document.getElementById("root")) -> <div id="root" />
 * @param root - The parameter `root` is likely referring to an HTML element that will serve as the
 * root or container for a web application or component. The `createRoot` function takes this element
 * as an argument and assigns it to a variable called `containerRoot`. This variable can then be used
 * to manipulate the contents
 *
 */
function createRoot(root) {
  containerRoot = root;
}

/**
 * @description The function creates a reference to a DOM element with the specified ID. This will be used to initialize the app.
 * @example Ryunix.init("root") -> <div id="root" />
 * @param root - The parameter "root" is the id of the HTML element that will serve as the container
 * for the root element.
 */
function init(root) {
  containerRoot = document.getElementById(root);
}

/**
 * The function renders an element into a container using a work-in-progress root.
 * @param element - The element parameter is the component or element that needs to be rendered in the
 * container. It could be a Ryunix component or a DOM element.
 * @param container - The container parameter is the DOM element where the rendered element will be
 * appended to. this parameter is optional if you use createRoot().
 */
function render(element, container) {
  wipRoot = {
    dom: containerRoot || container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

/**
 * This function uses requestIdleCallback to perform work on a fiber tree until it is complete or the
 * browser needs to yield to other tasks.
 * @param deadline - The `deadline` parameter is an object that represents the amount of time the
 * browser has to perform work before it needs to handle other tasks. It has a `timeRemaining()` method
 * that returns the amount of time remaining before the deadline is reached. The `shouldYield` variable
 * is used to determine
 */
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

/**
 * The function performs a unit of work by updating either a function component or a host component and
 * returns the next fiber to be processed.
 * @param fiber - A fiber is a unit of work in Ryunix that represents a component and its state. It
 * contains information about the component's type, props, and children, as well as pointers to its
 * parent, child, and sibling fibers. The `performUnitOfWork` function takes a fiber as a parameter and
 * performs work
 * @returns The function `performUnitOfWork` returns the next fiber to be processed. If the current
 * fiber has a child, it returns the child. Otherwise, it looks for the next sibling of the current
 * fiber. If there are no more siblings, it goes up the tree to the parent and looks for the next
 * sibling of the parent. The function returns `null` if there are no more fibers to process.
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

let wipFiber = null;
let hookIndex = null;

/**
 * This function updates a function component by setting up a work-in-progress fiber, resetting the
 * hook index, creating an empty hooks array, rendering the component, and reconciling its children.
 * @param fiber - The fiber parameter is an object that represents a node in the fiber tree. It
 * contains information about the component, its props, state, and children. In this function, it is
 * used to update the state of the component and its children.
 */
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

/**
 * This function updates a host component's DOM element and reconciles its children.
 * @param fiber - A fiber is a unit of work in Ryunix that represents a component and its state. It
 * contains information about the component's type, props, and children, as well as pointers to other
 * fibers in the tree.
 */
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children.flat());
}

/**
 * This function reconciles the children of a fiber node with a new set of elements, creating new
 * fibers for new elements, updating existing fibers for elements with the same type, and marking old
 * fibers for deletion if they are not present in the new set of elements.
 * @param wipFiber - A work-in-progress fiber object representing a component or element in the virtual
 * DOM tree.
 * @param elements - an array of elements representing the new children to be rendered in the current
 * fiber's subtree
 */
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
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
}


 
/**
 * The above function creates a context in JavaScript that allows for sharing data between components.
 * @param defaultValue - The `defaultValue` parameter is the initial value of the context. If no value
 * is provided, the `EMPTY_CONTEXT` symbol is used as the default value.
 * @returns The `createContext` function returns an object with two properties: `Provider` and
 * `Consumer`.
 */
const EMPTY_CONTEXT = Symbol();

function createContext(defaultValue) {
  let contextValue = defaultValue || EMPTY_CONTEXT;

  const Provider = (value, callback) => {
    contextValue = value;
    const currentValue = contextValue;
    callback();
    contextValue = currentValue;
  };

  const Consumer = () => {
    return contextValue;
  };

  return {
    Provider,
    Consumer,
  };
}

// Hooks

/**
 * The useContext function returns the Consumer component of a given reference.
 * @param ref - The "ref" parameter is a reference to a Ryunix context object.
 * @returns The `useContext` function is returning the result of calling the `Consumer` method on the
 * `ref` object.
 */
function useContext(ref) {
  return ref.Consumer();
}

/**
 * @description The function creates a state.
 * @param initial - The initial value of the state for the hook.
 * @returns The `useStore` function returns an array with two elements: the current state value and a
 * `setState` function that can be used to update the state.
 */
function useStore(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  /**
   * The function `setState` updates the state of a component in Ryunix by adding an action to a queue
   * and setting up a new work-in-progress root.
   * @param action - The `action` parameter is an object that represents a state update to be performed
   * on a component. It contains information about the type of update to be performed and any new data
   * that needs to be applied to the component's state.
   */
  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

/**
 * The function checks if the previous dependencies are different from the next dependencies.
 * @param prevDeps - The previous dependencies, which could be an array of values or objects that a
 * function or component depends on.
 * @param nextDeps - `nextDeps` is an array of dependencies that are being checked for changes. These
 * dependencies are typically used in React's `useEffect` and `useCallback` hooks to determine when a
 * component should re-render or when a function should be re-created.
 */
const hasDepsChanged = (prevDeps, nextDeps) =>
  !prevDeps ||
  !nextDeps ||
  prevDeps.length !== nextDeps.length ||
  prevDeps.some((dep, index) => dep !== nextDeps[index]);

/**
 * This is a function that creates a hook for managing side effects in Ryunix components.
 * @param effect - The effect function that will be executed after the component has rendered or when
 * the dependencies have changed. It can perform side effects such as fetching data, updating the DOM,
 * or subscribing to events.
 * @param deps - An array of dependencies that the effect depends on. If any of the dependencies change
 * between renders, the effect will be re-run. If the array is empty, the effect will only run once on
 * mount and never again.
 */
function useEffect(effect, deps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hasChanged = hasDepsChanged(oldHook ? oldHook.deps : undefined, deps);

  const hook = {
    tag: "effect",
    effect: hasChanged ? effect : null,
    cancel: hasChanged && oldHook && oldHook.cancel,
    deps,
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
}

// export

export { useStore, useEffect };

export default {
  createElement,
  render,
  createRoot,
  init,
};
