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

const createContext = (
  contextId = RYUNIX_TYPES.RYUNIX_CONTEXT,
  defaultValue = {},
) => {
  const Provider = ({ children }) => {
    return Fragment({
      children: children,
    })
  }

  Provider._contextId = contextId

  const useContext = (ctxID = RYUNIX_TYPES.RYUNIX_CONTEXT) => {
    let fiber = vars.wipFiber
    while (fiber) {
      if (fiber.type && fiber.type._contextId === ctxID) {
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

const useQuery = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const query = {}
  for (let [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}

const useHash = () => {
  const [hash, setHash] = useStore(window.location.hash)
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

const RouterContext = createContext('ryunix.navigation', {
  location: '/',
  params: {},
  query: {},
  navigate: (path) => {},
  route: null,
})

const findRoute = (routes, path) => {
  const pathname = path.split('?')[0].split('#')[0]

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
    const update = () => setLocation(window.location.pathname)

    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setLocation(window.location.pathname)
  }

  const currentRouteData = findRoute(routes, window.location.pathname) || {}
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
  return RouterContext.useContext('ryunix.navigation')
}

const Children = () => {
  const { route, params, query, location } = useRouter()
  if (!route || !route.component) return null
  const hash = useHash()

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [hash])

  return createElement(route.component, {
    key: location,
    params,
    query,
    hash,
  })
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
  useHash,
}
