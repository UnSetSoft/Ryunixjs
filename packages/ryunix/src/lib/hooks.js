import { RYUNIX_TYPES, STRINGS, vars } from '../utils/index'
import { isEqual } from 'lodash'
import { createElement } from './createElement'
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
    vars.wipFiber.alternate.hooks[vars.hookIndex]
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
      props: {
        ...vars.currentRoot.props,
      },
      alternate: vars.currentRoot,
    }
    vars.nextUnitOfWork = vars.wipRoot
    vars.deletions = []
  }

  if (vars.wipFiber && vars.wipFiber.hooks) {
    vars.wipFiber.hooks.push(hook)
    vars.hookIndex++
  }

  console.log(hook.state)

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
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

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

export {
  useStore,
  useEffect,
  useQuery,
  useRef,
  useMemo,
  useCallback,
  useRouter,
}
