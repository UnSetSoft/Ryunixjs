import {
  RYUNIX_TYPES,
  STRINGS,
  vars,
  generateHash,
  generateHookHash,
} from '../utils/index'
import { isEqual } from 'lodash'
import { createElement } from './createElement'
import { workLoop } from './workers'

/**
 * `useReducer` hook for managing complex state with reducer logic.
 *
 * @param {function} reducer - A reducer function that takes the current state and an action, and returns the new state.
 * @param {*} initialState - The initial state value or an initial function that returns the initial state.
 * @param {function} [init] - An optional initializer function to transform initial state.
 * @returns {Array} - An array containing:
 *    - `state` (any): The current state value.
 *    - `dispatch` (function): A function to dispatch actions to update the state.
 *
 * @example
 * // Using useReducer in a component to manage a counter
 * const reducer = (state, action) => {
 *   switch (action.type) {
 *     case "INCREMENT":
 *       return state + 1;
 *     case "DECREMENT":
 *       return state - 1;
 *     default:
 *       return state;
 *   }
 * };
 *
 * const App = () => {
 *   const [state, dispatch] = useReducer(reducer, 0);
 *   return (
 *     <>
 *       <button onClick={() => dispatch({ type: "INCREMENT" })}>Increment</button>
 *       <div>Count: {state}</div>
 *     </>
 *   );
 * };
 */

const useReducer = (reducer, initialState, init) => {
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_REDUCE)
  const oldHook = vars.wipFiber.alternate?.hooks?.[hookHash]

  // Utilizamos useMemo para memorizar el estado inicial de forma eficiente
  const initial = useMemo(() => (init ? init(initialState) : initialState), [])

  // Creamos el hook con el estado y una cola de acciones inicial
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? oldHook.queue : [],
    reducer,
  }

  // Agregamos logs de depuración
  console.log(`--------------[${hookHash}]------------------`)
  console.log('[useReducer] initial state ', initialState)
  console.log('[useReducer] hook.state: ', hook.state)
  console.log('[useReducer] hook.reducer: ', hook.reducer)
  console.log('[useReducer] hook.queue: ', hook.queue)
  console.log('[useReducer] hook: ', hook)
  console.log('---------------------------------------------')

  // Función de despachador que usa useCallback para evitar recrearla innecesariamente
  const dispatch = useCallback((action) => {
    // Añadimos la acción a la cola
    hook.queue.push(action)
    // Creamos una nueva raíz de trabajo para procesar la actualización
    vars.wipRoot = {
      dom: vars.currentRoot.dom,
      props: vars.currentRoot.props,
      alternate: vars.currentRoot,
    }
    vars.nextUnitOfWork = vars.wipRoot
    vars.deletions = []

    requestIdleCallback(workLoop)
  }, [])

  // Aplicamos las acciones acumuladas en la cola al estado actual
  hook.queue.forEach((action) => {
    hook.state = hook.reducer(hook.state, action)
  })

  // Limpiamos la cola para evitar que las acciones se procesen repetidamente
  hook.queue = []

  // Guardamos el hook en la fibra en progreso
  vars.wipFiber.hooks = vars.wipFiber.hooks || []
  vars.wipFiber.hooks[hookHash] = hook

  // Integración de useEffect para reaccionar a los cambios en el estado
  useEffect(() => {
    // Aquí puedes ejecutar cualquier lógica que necesite reaccionar al cambio en el estado
    console.log('El estado se ha actualizado: ', hook.state)
  }, [hook.state]) // Dependencia en hook.state para ejecutar el efecto cuando cambie

  return [hook.state, dispatch]
}

/**
 * `useStore` is a state management hook to handle component state updates efficiently.
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

/**
 * @description The function creates a state.
 * @param initial - The initial value of the state for the hook.
 * @returns The `useStore` function returns an array with two elements: the current state value and a
 * `setState` function that can be used to update the state.
 */
const useStore = (initial) => {
  // Wrap `useReducer` with a simple reducer for updating state directly
  return useReducer((state, action) => {
    return typeof action === STRINGS.function ? action(state) : action
  }, initial)
}

/**
 * `useEffect` is a hook to handle side effects in components with optimized dependency tracking.

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
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_EFFECT)

  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[hookHash]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    cleanup: null,
  }

  if (!oldHook || !isEqual(oldHook.deps, hook.deps)) {
    if (typeof oldHook?.cleanup === STRINGS.function) {
      oldHook.cleanup()
    }

    hook.cleanup = callback()
  }
  vars.wipFiber.hooks = vars.wipFiber.hooks || []
  vars.wipFiber.hooks[hookHash] = hook
}

const useRef = (initial) => {
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_REF)

  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[hookHash]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? oldHook.value : { current: initial },
  }

  vars.wipFiber.hooks = vars.wipFiber.hooks || []
  vars.wipFiber.hooks[hookHash] = hook
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
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_MEMO)

  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[hookHash]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_MEMO,
    value: null,
    deps,
    hash: generateHash(deps),
  }

  if (!oldHook || oldHook.hash !== hook.hash) {
    hook.value = compute()
  } else {
    hook.value = oldHook.value
  }

  vars.wipFiber.hooks = vars.wipFiber.hooks || []
  vars.wipFiber.hooks[hookHash] = hook

  return hook.value
}

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
 * `useRouter` is a routing function to manage navigation, nested routes, and route pre-loading.
 *
 * This function handles client-side routing, URL updates, and component rendering based on defined routes. It supports:
 * - Dynamic routes (e.g., "/user/:id").
 * - Optional nested routes with an `subRoutes` property in route objects.
 * - Default pre-loading of all routes except the current active route.
 *
 * @param {Array} routes - An array of route objects, each containing:
 *    - `path` (string): The URL path to match (supports dynamic segments like "/user/:id").
 *    - `component` (function): The component to render when the route matches.
 *    - `subRoutes` (optional array): An optional array of nested route objects, defining sub-routes for this route.
 *    - `NotFound` (optional function): Component to render for unmatched routes (default 404 behavior).
 *
 * @returns {Object} - An object with:
 *    - `Children` (function): Returns the component that matches the current route, passing route parameters and query parameters as props.
 *    - `NavLink` (component): A link component to navigate within the application without refreshing the page.
 *    - `navigate` (function): Allows programmatically navigating to a specific path.
 *
 * @example
 * // Define nested routes
 * const routes = [
 *   {
 *     path: "/",
 *     component: HomePage,
 *     subRoutes: [
 *       {
 *         path: "/settings",
 *         component: SettingsPage,
 *       },
 *     ],
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
 *   <>
 *     <NavLink to="/">Home</NavLink>
 *     <NavLink to="/settings">Settings</NavLink>
 *     <NavLink to="/user/123">User Profile</NavLink>
 *     <Children />
 *   </>
 * );
 */
const useRouter = (routes) => {
  const [location, setLocation] = useStore(window.location.pathname)

  const findRoute = (routes, path) => {
    const pathname = path.split('?')[0]

    const notFoundRoute = routes.find((route) => route.NotFound)
    const notFound = notFoundRoute
      ? { route: { component: notFoundRoute.NotFound }, params: {} }
      : { route: { component: null }, params: {} }

    for (const route of routes) {
      if (route.subRoutes) {
        const childRoute = findRoute(route.subRoutes, path)
        if (childRoute) return childRoute
      }

      if (route.path === '*') {
        return notFound
      }

      if (!route.path || typeof route.path !== 'string') {
        console.warn('Invalid route detected:', route)
        console.info(
          "if you are using { NotFound: NotFound } please add { path: '*', NotFound: NotFound }",
        )
        continue
      }

      const keys = []
      const pattern = new RegExp(
        `^${route.path.replace(/:\w+/g, (match) => {
          keys.push(match.substring(1))
          return '([^/]+)'
        })}$`,
      )

      const match = pathname.match(pattern)
      if (match) {
        const params = keys.reduce((acc, key, index) => {
          acc[key] = match[index + 1]
          return acc
        }, {})

        return { route, params }
      }
    }

    return notFound
  }

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    updateRoute(path)
  }

  const updateRoute = (path) => {
    const cleanedPath = path.split('?')[0]
    setLocation(cleanedPath)
  }

  useEffect(() => {
    const onPopState = () => updateRoute(window.location.pathname)
    window.addEventListener('popstate', onPopState)

    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const currentRouteData = findRoute(routes, location) || {}

  const Children = () => {
    const query = useQuery()
    const { route } = currentRouteData

    if (
      !route ||
      !route.component ||
      typeof route.component !== STRINGS.function
    ) {
      console.error(
        'Component not found for current path or the component is not a valid function:',
        currentRouteData,
      )
      return null
    }

    return route.component({
      params: currentRouteData.params || {},
      query,
    })
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

/**
 * `createContext` creates a context object to share global data among deeply nested components.
 *
 * This function creates a context with a Provider and a consumer hook. The Provider component
 * allows passing down data, while the consumer hook (`useContext`) enables access to the context value.
 * The implementation mirrors the behavior of a typical context API for flexible state management.
 *
 * @param {*} defaultValue - The default value for the context.
 *
 * @returns {Object} - An object containing:
 *    - `Provider` (component): A component that provides the context value to its descendants.
 *    - `useContext` (hook): A hook that allows consuming the context value within components.
 *
 * @example
 * // Create a context for theme management
 * const ThemeContext = createContext("light");
 *
 * // Use the ThemeContext in a component tree
 * const App = () => {
 *   return (
 *     <ThemeContext.Provider value="dark">
 *       <DeeplyNestedComponent />
 *     </ThemeContext.Provider>
 *   );
 * };
 *
 * // Consume the context in a deeply nested component
 * const DeeplyNestedComponent = () => {
 *   const theme = ThemeContext.useContext();
 *   return <div>Current Theme: {theme}</div>;
 * };
 */
const createContext = (defaultValue) => {
  let context = {
    value: defaultValue,
    listeners: new Set(),
  }

  const Provider = ({ value, children }) => {
    context.value = value
    context.listeners.forEach((listener) => listener(value))
    return children
  }

  const useContext = () => {
    const [state, setState] = useStore(context.value)

    // Subscribe to context changes
    useEffect(() => {
      const listener = (newValue) => setState(newValue)
      context.listeners.add(listener)

      // Unsubscribe on cleanup
      return () => context.listeners.delete(listener)
    }, [])

    return state
  }

  return { Provider, useContext }
}

export {
  useStore,
  useEffect,
  useQuery,
  useRef,
  useMemo,
  useCallback,
  useRouter,
  useReducer,
}
