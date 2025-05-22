import { RYUNIX_TYPES, STRINGS, vars } from '../utils/index'
import { isEqual } from 'lodash'
import { createElement } from './createElement'
import { scheduleUpdate } from './workers'
/**
 * @description The function creates a state.
 * @param initial - The initial value of the state for the hook.
 * @returns The `useStore` function returns an array with two elements: the current state value and a
 * `setState` function that can be used to update the state.
 */
const fiberHooks = new WeakMap()

const useStore = (initial) => {
  const fiber = vars.wipFiber
  if (!fiberHooks.has(fiber)) {
    fiberHooks.set(fiber, [])
  }

  const hooks = fiberHooks.get(fiber)
  const hookIndex = vars.hookIndex++
  const hook = hooks[hookIndex] || { state: initial, queue: [] }

  // Procesar actualizaciones en la cola
  hook.queue.forEach((update) => {
    hook.state = typeof update === 'function' ? update(hook.state) : update
  })

  hook.queue = [] // Limpiar la cola después de procesar

  const setState = (update) => {
    hook.queue.push(update)
    console.log('[hook] setState', {
      state: hook.state,
      queue: hook.queue,
      hooks: hooks[hookIndex],
      fiber,
    })

    scheduleUpdate(fiber) // Asegurar que se programe la actualización
  }

  hooks[hookIndex] = hook

  console.log('[hook] useStore', {
    state: hook.state,
    queue: hook.queue,
    hooks: hooks[hookIndex],
    fiber,
  })

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
      const { path, params } = route

      // Handle dynamic routes
      const pathToRegex = (path) =>
        new RegExp('^' + path.replace(/:[^/]+/g, '([^/]+)') + '(\\/|$)')
      const match = pathname.match(pathToRegex(path))

      if (match) {
        const paramNames = (path.match(/:[^/]+/g) || []).map((p) => p.slice(1))
        const paramValues = match.slice(1).map(decodeURIComponent)

        return {
          route,
          params: Object.fromEntries(
            paramNames.map((name, i) => [name, paramValues[i]]),
          ),
        }
      }
    }

    return notFound
  }

  const { route, params } = findRoute(routes, location)

  // Actualizar la ubicación en caso de navegación interna
  const navigate = (to) => {
    window.history.pushState(null, '', to)
    setLocation(to)
  }

  const Children = () => {
    const { component: RouteComponent } = route

    return RouteComponent
      ? createElement(RouteComponent, { params, query: useQuery() })
      : null
  }

  const NavLink = ({ to, children, ...props }) => {
    const isActive = location === to

    const handleClick = (e) => {
      e.preventDefault()
      navigate(to)
    }

    return (
      <a
        href={to}
        onClick={handleClick}
        {...props}
        style={{ fontWeight: isActive ? 'bold' : 'normal' }}
      >
        {children}
      </a>
    )
  }

  return { Children, NavLink, navigate }
}

export {
  useStore,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useQuery,
  useRouter,
}
