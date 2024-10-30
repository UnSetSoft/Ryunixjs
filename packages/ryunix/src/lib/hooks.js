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

  const initial = useMemo(() => (init ? init(initialState) : initialState), [])

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? oldHook.queue : [],
    reducer,
  }

  console.log(`--------------[${hookHash}]------------------`)
  console.log('[useReducer] initial state ', initialState)
  console.log('[useReducer] hook.state: ', hook.state)
  console.log('[useReducer] hook.reducer: ', hook.reducer)
  console.log('[useReducer] hook.queue: ', hook.queue)
  console.log('[useReducer] hook: ', hook)
  console.log('---------------------------------------------')

  const dispatch = useCallback((action) => {
    hook.queue.push(action)
    vars.wipRoot = {
      dom: vars.currentRoot.dom,
      props: vars.currentRoot.props,
      alternate: vars.currentRoot,
    }
    vars.nextUnitOfWork = vars.wipRoot
    vars.deletions = []

    requestIdleCallback(workLoop)
  }, [])

  hook.queue.forEach((action) => {
    hook.state = hook.reducer(hook.state, action)
  })

  hook.queue = []

  vars.wipFiber.hooks = vars.wipFiber.hooks || []
  vars.wipFiber.hooks[hookHash] = hook

  useEffect(() => {
    console.log('El estado se ha actualizado: ', hook.state)
  }, [hook.state])

  return [hook.state, dispatch]
}

/**
 * @description The function creates a state.
 * @param initial - The initial value of the state for the hook.
 * @returns The `useStore` function returns an array with two elements: the current state value and a
 * `setState` function that can be used to update the state.
 */
const useStore = (initial, newStore = false) => {
  if (newStore) {
    return useReducer((state, action) => {
      return typeof action === STRINGS.function ? action(state) : action
    }, initial)
  }

  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_STORE)
  const oldHook = vars.wipFiber.alternate?.hooks?.[hookHash]

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? [...oldHook.queue] : [],
  }

  hook.queue.forEach((action) => {
    hook.state =
      typeof action === STRINGS.function ? action(hook.state) : action
  })

  hook.queue = []

  const setState = (action) => {
    hook.queue.push(action)

    vars.wipRoot = {
      dom: vars.currentRoot.dom,
      props: vars.currentRoot.props,
      alternate: vars.currentRoot,
    }
    vars.nextUnitOfWork = vars.wipRoot
    vars.deletions = []
  }

  if (vars.wipFiber && vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook)
    vars.hookIndex++
  }

  return [hook.state, setState]
}

/**
 * This is a function that creates a hook for managing side effects in Ryunix components.
 * @param effect - The effect function that will be executed after the component has rendered or when
 * the dependencies have changed. It can perform side effects such as fetching data, updating the DOM,
 * or subscribing to events.
 * @param deps - An array of dependencies that the effect depends on. If any of the dependencies change
 * between renders, the effect will be re-run. If the array is empty, the effect will only run once on
 * mount and never again.
 */

const useEffect = (callback, deps) => {
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_EFFECT)
  const oldHook = vars.wipFiber.alternate?.hooks?.[hookHash]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
  }

  if (!oldHook) {
    // invoke callback if this is the first time
    callback()
  } else {
    if (!isEqual(oldHook.deps, hook.deps)) {
      callback()
    }
  }

  if (vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook)
    vars.hookIndex++
  }
}

const useRef = (initial) => {
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_REF)
  const oldHook = vars.wipFiber.alternate?.hooks?.[hookHash]

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

const useMemo = (comp, deps) => {
  const hookHash = generateHookHash(vars.wipFiber, RYUNIX_TYPES.RYUNIX_MEMO)
  const oldHook = vars.wipFiber.alternate?.hooks?.[hookHash]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_MEMO,
    value: null,
    deps,
  }

  if (oldHook) {
    if (isEqual(oldHook.deps, hook.deps)) {
      hook.value = oldHook.value
    } else {
      hook.value = comp()
    }
  } else {
    hook.value = comp()
  }

  if (vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook)
    vars.hookIndex++
  }

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

export {
  useStore,
  useEffect,
  useQuery,
  useRef,
  useMemo,
  useCallback,
  useRouter,
}
