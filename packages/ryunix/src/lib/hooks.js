import { hasDepsChanged } from "./effects";
import { RYUNIX_TYPES, STRINGS, vars } from "../utils/index";


/**
 * @description The function creates a state.
 * @param initial - The initial value of the state for the hook.
 * @returns The `useStore` function returns an array with two elements: the current state value and a
 * `setState` function that can be used to update the state.
 */
const useStore = (initial) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state =
      typeof action === STRINGS.function ? action(hook.state) : action;
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
    vars.wipRoot = {
      dom: vars.currentRoot.dom,
      props: vars.currentRoot.props,
      alternate: vars.currentRoot,
    };
    vars.nextUnitOfWork = vars.wipRoot;
    vars.deletions = [];
  };

  vars.wipFiber.hooks.push(hook);
  vars.hookIndex++;
  return [hook.state, setState];
};

/**
 * This is a function that creates a hook for managing side effects in Ryunix components.
 * @param effect - The effect function that will be executed after the component has rendered or when
 * the dependencies have changed. It can perform side effects such as fetching data, updating the DOM,
 * or subscribing to events.
 * @param deps - An array of dependencies that the effect depends on. If any of the dependencies change
 * between renders, the effect will be re-run. If the array is empty, the effect will only run once on
 * mount and never again.
 */
const useEffect = (effect, deps) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex];

  const hasChanged = hasDepsChanged(oldHook ? oldHook.deps : undefined, deps);

  const hook = {
    tag: RYUNIX_TYPES.RYUNIX_EFFECT,
    effect: hasChanged ? effect : null,
    cancel: hasChanged && oldHook && oldHook.cancel,
    deps,
  };

  vars.wipFiber.hooks.push(hook);
  vars.hookIndex++;
};

const useQuery = () => {
  vars.hookIndex++;

  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex];

  const hasOld = oldHook ? oldHook : undefined;

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const Query = hasOld ? hasOld : params;

  const hook = {
    tag: RYUNIX_TYPES.RYUNIX_EFFECT,
    query: Query,
  };

  vars.wipFiber.hooks.push(hook);

  return hook.query;
};

export { useStore, useEffect, useQuery };
