import { RYUNIX_TYPES, STRINGS, vars } from '../utils/index'
import { isEqual } from 'lodash'
import { createElement, Fragment } from './createElement'
import { scheduleWork } from './workers'

/**
 * @description The function creates a state.
 * @param initial - The initial value of the state for the hook.
 * @returns The `useStore` function returns an array with two elements: the current state value and a
 * `setState` function that can be used to update the state.
 */
const useStore = (initialState, init) => {
  const reducer = (state, action) =>
    typeof action === 'function' ? action(state) : action

  return useReducer(reducer, initialState, init)
}

const useReducer = (reducer, initialState, init) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    queue: oldHook && Array.isArray(oldHook.queue) ? oldHook.queue.slice() : [],
  }

  if (oldHook && Array.isArray(oldHook.queue)) {
    oldHook.queue.forEach((action) => {
      hook.state = reducer(hook.state, action)
    })
  }

  const dispatch = (action) => {
    hook.queue.push(action)

    vars.wipRoot = {
      dom: vars.currentRoot.dom,
      props: vars.currentRoot.props,
      alternate: vars.currentRoot,
    }
    vars.deletions = []
    vars.hookIndex = 0
    scheduleWork(vars.wipRoot)
  }

  hook.queue.forEach((action) => {
    hook.state = reducer(hook.state, action)
  })

  vars.wipFiber.hooks[vars.hookIndex] = hook
  vars.hookIndex++

  return [hook.state, dispatch]
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
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    cleanup: oldHook?.cleanup,
  }

  const hasChanged = !oldHook || !isEqual(oldHook.deps, deps)

  if (hasChanged) {
    vars.effects.push(() => {
      // Llama al cleanup anterior si existe
      if (typeof hook.cleanup === 'function') {
        hook.cleanup()
      }

      // Ejecuta el nuevo efecto y guarda el nuevo cleanup
      const result = callback()
      if (typeof result === 'function') {
        hook.cleanup = result
      }
    })
  }

  vars.wipFiber.hooks[vars.hookIndex] = hook
  vars.hookIndex++
}

/**
 * The useRef function in JavaScript is used to create a reference object that persists between renders
 * in a functional component.
 * @param initial - The `initial` parameter in the `useRef` function represents the initial value that
 * will be assigned to the `current` property of the reference object. This initial value will be used
 * if there is no previous value stored in the hook.
 * @returns The `useRef` function is returning the `current` property of the `hook.value` object. This
 * property contains the current value of the reference being managed by the `useRef` hook.
 */
const useRef = (initial) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? oldHook.value : { current: initial },
  }

  vars.wipFiber.hooks[vars.hookIndex] = hook
  vars.hookIndex++

  return hook.value
}

/**
 * The useMemo function in JavaScript is used to memoize the result of a computation based on the
 * dependencies provided.
 * @param comp - The `comp` parameter in the `useMemo` function is a function that represents the
 * computation that needs to be memoized. This function will be executed to calculate the memoized
 * value based on the dependencies provided.
 * @param deps - The `deps` parameter in the `useMemo` function stands for dependencies. It is an array
 * of values that the function depends on. The `useMemo` function will only recompute the memoized
 * value when one of the dependencies has changed.
 * @returns The `useMemo` function returns the `value` property of the `hook` object, which is either
 * the memoized value from the previous render if the dependencies have not changed, or the result of
 * calling the `comp` function if the dependencies have changed.
 */
const useMemo = (comp, deps) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

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

  vars.wipFiber.hooks[vars.hookIndex] = hook
  vars.hookIndex++

  return hook.value
}

/**
 * The useCallback function in JavaScript returns a memoized version of the callback function that only
 * changes if one of the dependencies has changed.
 * @param callback - The `callback` parameter is a function that you want to memoize using
 * `useCallback`. This function will only be re-created if any of the dependencies specified in the
 * `deps` array change.
 * @param deps - Dependencies array that the callback function depends on.
 * @returns The useCallback function is returning a memoized version of the callback function. It is
 * using the useMemo hook to memoize the callback function based on the provided dependencies (deps).
 */
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

const createContext = (defaultValue) => {
  const contextId = RYUNIX_TYPES.RYUNIX_CONTEXT

  const Provider = ({ value, children }) => {
    return Fragment({
      children: children,
    })
  }

  Provider._contextId = contextId

  const useContext = () => {
    let fiber = vars.wipFiber
    while (fiber) {
      if (fiber.type && fiber.type._contextId === contextId) {
        if (fiber.props && 'value' in fiber.props) {
          return fiber.props.value
        }
        return undefined
      }
      fiber = fiber.parent
    }
    return defaultValue
  }

  return {
    Provider,
    useContext,
  }
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
// const useRouter = (routes) => {
//   const [location, setLocation] = useStore(window.location.pathname)

//   const findRoute = (routes, path) => {
//     const pathname = path.split('?')[0]

//     const notFoundRoute = routes.find((route) => route.NotFound)
//     const notFound = notFoundRoute
//       ? { route: { component: notFoundRoute.NotFound }, params: {} }
//       : { route: { component: null }, params: {} }

//     for (const route of routes) {
//       if (route.subRoutes) {
//         const childRoute = findRoute(route.subRoutes, path)
//         if (childRoute) return childRoute
//       }

//       if (route.path === '*') {
//         return notFound
//       }

//       if (!route.path || typeof route.path !== 'string') {
//         console.warn('Invalid route detected:', route)
//         console.info(
//           "if you are using { NotFound: NotFound } please add { path: '*', NotFound: NotFound }",
//         )
//         continue
//       }

//       const keys = []
//       const pattern = new RegExp(
//         `^${route.path.replace(/:\w+/g, (match) => {
//           keys.push(match.substring(1))
//           return '([^/]+)'
//         })}$`,
//       )

//       const match = pathname.match(pattern)
//       if (match) {
//         const params = keys.reduce((acc, key, index) => {
//           acc[key] = match[index + 1]
//           return acc
//         }, {})

//         return { route, params }
//       }
//     }

//     return notFound
//   }

//   const navigate = (path) => {
//     window.history.pushState({}, '', path)

//     updateRoute(path)
//   }

//   const updateRoute = (path) => {
//     const cleanedPath = path.split('?')[0]
//     setLocation(cleanedPath)
//   }

//   useEffect(() => {
//     const onPopState = () => updateRoute(window.location.pathname)
//     window.addEventListener('popstate', onPopState)

//     return () => window.removeEventListener('popstate', onPopState)
//   }, [])

//   const currentRouteData = findRoute(routes, location) || {}

//   const Children = () => {
//     const query = useQuery()
//     const { route } = currentRouteData

//     if (
//       !route ||
//       !route.component ||
//       typeof route.component !== STRINGS.function
//     ) {
//       console.error(
//         'Component not found for current path or the component is not a valid function:',
//         currentRouteData,
//       )
//       return null
//     }

//     const WrappedComponent = () =>
//       createElement(route.component, {
//         key: location,
//         params: currentRouteData.params || {},
//         query,
//       })

//     return createElement(WrappedComponent)
//   }

//   const NavLink = ({ to, ...props }) => {
//     const handleClick = (e) => {
//       e.preventDefault()
//       navigate(to)
//     }
//     return createElement(
//       'a',
//       { href: to, onClick: handleClick, ...props },
//       props.children,
//     )
//   }

//   return { Children, NavLink, navigate }
// }

// Crear contexto para Router
const RouterContext = createContext({
  location: '/',
  params: {},
  query: {},
  navigate: (path) => {},
  route: null,
})

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

const RouterProvider = ({ routes, children }) => {
  const [location, setLocation] = useStore(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setLocation(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setLocation(path)
  }

  const currentRouteData = findRoute(routes, location) || {}
  const query = useQuery()

  const contextValue = {
    location,
    params: currentRouteData.params || {},
    query,
    navigate,
    route: currentRouteData.route,
  }

  return createElement(
    RouterContext.Provider,
    { value: contextValue },
    Fragment({
      children: children,
    }),
  )
}

const useRouter = () => {
  return RouterContext.useContext()
}

const Children = () => {
  const { route, params, query, location } = useRouter()

  if (!route || !route.component) return null

  return createElement(
    RYUNIX_TYPES.RYUNIX_FRAGMENT,
    {},
    createElement(route.component, { key: location, params, query }),
  )
}

// Componente NavLink para navegación interna
const NavLink = ({ to, ...props }) => {
  const { navigate } = useRouter()

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

export {
  useStore,
  useEffect,
  useQuery,
  useRef,
  useMemo,
  useCallback,
  createContext,
  //navigation
  RouterProvider,
  useRouter,
  Children,
  NavLink,
}
