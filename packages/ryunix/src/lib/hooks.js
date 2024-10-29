import { RYUNIX_TYPES, STRINGS, vars, generateHash } from '../utils/index'
import { isEqual } from 'lodash'
import { createElement } from './createElement'

/**
 * `useStore` is a custom state management hook to handle component state updates efficiently.
 *
 * This hook manages component state and utilizes batching to avoid reconciling the entire component structure on every `setState` call.
 * Updates are queued and processed in a batch during the next available frame, improving performance.
 *
 * @param {*} initial - The initial state value for the component.
 * 
 * @returns {Array} - An array containing:
 *    - `state` (any): The current state value.
 *    - `setState` (function): A function to update the state.
 *
 * @example
 * // Using useStore in a component to manage a counter
 * const App = () => {
 *   const [count, setCount] = useStore(0);
 *   return (
 *     <>
 *       <button onClick={() => setCount(count + 1)}>Count: {count}</button>
 *     </>
 *   );
 * };
 */

const useStore = (initial) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? [...oldHook.queue] : [],
  };

  hook.queue.forEach((action) => {
    hook.state =
      typeof action === STRINGS.function ? action(hook.state) : action;
  });

  hook.queue = [];
  vars.pendingUpdates = []

  const setState = (action) => {
    hook.queue.push(action);
    vars.pendingUpdates.push(() => {
      vars.wipRoot = {
        dom: vars.currentRoot.dom,
        props: vars.currentRoot.props,
        alternate: vars.currentRoot,
      };
      vars.nextUnitOfWork = vars.wipRoot;
      vars.deletions = [];
    });

    if (vars.pendingUpdates.length === 1) {
      requestIdleCallback(() => {
        vars.pendingUpdates.forEach(update => update());
        vars.pendingUpdates.length = 0;
      });
    }
  };

  if (vars.wipFiber && vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook);
    vars.hookIndex++;
  }

  return [hook.state, setState];
};

/**
 * `useEffect` is a custom hook to handle side effects in components with optimized dependency tracking.
 *
 * This hook runs a callback function after the component renders, based on the provided dependencies.
 * It also supports an optional cleanup function that runs automatically when the component unmounts or when dependencies change.
 * Dependency changes are detected using an efficient hash comparison, which reduces unnecessary re-renders.
 *
 * @param {function} callback - A function to execute after the component has rendered or when dependencies have changed.
 *    - If the callback returns a function, it will be used as a cleanup function to execute when the effect needs to be cleaned up.
 * @param {Array} deps - An array of dependencies that determine when the callback should be executed. If any dependency changes, the effect will re-run.
 *
 * @example
 * // Using useEffect to set up an interval and clean it up automatically
 * const App = () => {
 *   useEffect(() => {
 *     const interval = setInterval(() => {
 *       console.log("Running effect");
 *     }, 1000);
 *     return () => clearInterval(interval); // Cleanup automatically when unmounted
 *   }, []);
 *   return (
 *     <>
 *       <div>Effect Example</div>
 *     </>
 *   );
 * };
 */

const useEffect = (callback, deps) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex];

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    hash: generateHash(deps),
    cleanup: oldHook ? oldHook.cleanup : undefined,
  };

  const hasChangedDeps =
    !oldHook || oldHook.hash !== hook.hash;

  if (hasChangedDeps) {
    if (hook.cleanup) hook.cleanup();
    const result = callback();
    if (typeof result === STRINGS.function) {
      hook.cleanup = result;
    }
  }

  // @ts-ignore
  if (vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook);
    vars.hookIndex++;
  }
};


const useRef = (initial) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? oldHook.value : { current: initial },
  }

  if (vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook)
    vars.hookIndex++
  }

  return hook.value
}

/**
 * `useMemo` is a custom hook to memoize a value based on its dependencies, with optimized dependency tracking.
 *
 * This hook returns a memoized value that is only recomputed when its dependencies change.
 * Dependency changes are detected using an efficient hash comparison, which reduces unnecessary recomputations.
 *
 * @param {function} compute - A function that computes the value to be memoized.
 * @param {Array} deps - An array of dependencies that determine when the memoized value should be recomputed.
 *
 * @returns {*} - The memoized value.
 *
 * @example
 * // Using useMemo to memoize a calculated value based on dependencies
 * const App = () => {
 *   const memoizedValue = useMemo(() => {
 *     return computeHeavyOperation();
 *   }, [dependency1, dependency2]);
 * 
 *   return (
 *     <>
 *       <div>Memoized Value: {memoizedValue}</div>
 *     </>
 *   );
 * };
 */
const useMemo = (compute, deps) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex];

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_MEMO,
    value: null,
    deps,
    hash: generateHash(deps),
  };

  if (!oldHook || oldHook.hash !== hook.hash) {
    hook.value = compute();
  } else {
    hook.value = oldHook.value;
  }

  if (vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook);
    vars.hookIndex++;
  }

  return hook.value;
};


const useCallback = (callback, deps) => {
  return useMemo(() => callback, deps)
}

/**
 * The `useQuery` function parses the query parameters from the URL and returns them as an object.
 * @returns An object containing key-value pairs of the query parameters from the URLSearchParams in
 * the current window's URL is being returned.
 */
const useQuery = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const query = {}
  for (let [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}

/**
 * useRouter is a routing function to manage navigation and route matching.
 *
 * This function handles client-side routing, URL updates, and component rendering based on defined routes.
 * It supports dynamic routes (e.g., "/user/:id") and allows navigation using links.
 *
 * @param {Array} routes - An array of route objects, each containing:
 *    - `path` (string): The URL path to match (supports dynamic segments like "/user/:id").
 *    - `component` (function): The component to render when the route matches.
 *    - `NotFound` (optional function): Component to render for unmatched routes (default 404 behavior).
 *
 * @returns {Object} - An object with:
 *    - `Children` (function): Returns the component that matches the current route, passing route parameters and query parameters as props.
 *    - `NavLink` (component): A link component to navigate within the application without refreshing the page.
 *
 * @example
 * // Define routes
 * const routes = [
 *   {
 *     path: "/",
 *     component: HomePage,
 *   },
 *   {
 *     path: "/user/:id",
 *     component: UserProfile,
 *   },
 *   {
 *     path: "*",
 *     NotFound: NotFoundPage,
 *   },
 * ];
 *
 * // Use the routing function
 * const { Children, NavLink } = useRouter(routes);
 *
 * // Render the matched component
 * const App = () => (
 *   <div>
 *     <NavLink to="/">Home</NavLink>
 *     <NavLink to="/user/123">User Profile</NavLink>
 *     <Children />
 *   </div>
 * );
 *
 * // Example: UserProfile Component that receives route parameters
 * const UserProfile = ({ params, query }) => {
 *   return (
 *     <div>
 *       <h1>User ID: {params.id}</h1>
 *       <p>Query Parameters: {JSON.stringify(query)}</p>
 *     </div>
 *   );
 * };
 */

const useRouter = (routes) => {
  const [location, setLocation] = useStore(window.location.pathname)

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    updateRoute(path)
  }

  const updateRoute = (path) => {
    setLocation(path.split('?')[0])
  }

  useEffect(() => {
    const onPopState = () => updateRoute(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const findCurrentRoute = (routes, path) => {
    const pathname = path.split('?')[0]

    for (const { path: routePath, component } of routes) {
      if (!routePath) continue

      const keys = []
      const pattern = new RegExp(
        `^${routePath.replace(/:\w+/g, (match) => {
          keys.push(match.substring(1)) // Extract only the name without ":" and add to keys
          return '([^/]+)'
        })}$`,
      )

      const match = pathname.match(pattern)
      if (match) {
        const params = keys.reduce((acc, key, index) => {
          acc[key] = match[index + 1] // Match and assign the correct parameter value
          return acc
        }, {})
        return { route: { component }, params }
      }
    }

    // Return NotFound component if no match is found
    const notFoundRoute = routes.find((route) => route.NotFound)
    return notFoundRoute
      ? { route: { component: notFoundRoute.NotFound }, params: {} }
      : { route: { component: null }, params: {} }
  }

  const currentRouteData = findCurrentRoute(routes, location)
  const Children = () => {
    const query = useQuery()
    return currentRouteData.route.component
      ? currentRouteData.route.component({
          params: currentRouteData.params,
          query,
        })
      : null
  }

  const NavLink = ({ to, ...props }) => {
    const handleClick = (e) => {
      e.preventDefault()
      navigate(to)
    }
    return createElement(
      'a',
      { href: to, onClick: handleClick, ...props },
      props.children,
    )
  }

  return { Children, NavLink, navigate }
}

export {
  useStore,
  useEffect,
  useQuery,
  useRef,
  useMemo,
  useCallback,
  useRouter,
}
