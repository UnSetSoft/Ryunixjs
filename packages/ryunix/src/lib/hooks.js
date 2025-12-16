import { RYUNIX_TYPES, getState, is } from '../utils/index'
import { createElement, Fragment } from './createElement'
import { scheduleWork } from './workers'
import { Priority } from './priority'

const validateHookCall = () => {
  const state = getState()
  if (!state.wipFiber) {
    throw new Error(
      'Hooks can only be called inside the body of a function component.',
    )
  }
  if (!Array.isArray(state.wipFiber.hooks)) {
    state.wipFiber.hooks = []
  }
}

const haveDepsChanged = (oldDeps, newDeps) => {
  if (!oldDeps || !newDeps) return true
  if (oldDeps.length !== newDeps.length) return true
  return oldDeps.some((dep, i) => !Object.is(dep, newDeps[i]))
}

/**
 * The `useStore` function in JavaScript is a custom hook that uses a reducer to manage state updates
 * based on actions provided.
 * @param initialState - The `initialState` parameter in the `useStore` function is the initial state
 * of the store that will be used with the `useReducer` hook. It represents the starting state of the
 * store before any actions are dispatched to update it.
 * @returns The `useStore` function is returning the result of calling the `useReducer` hook with the
 * `reducer` function and the `initialState` as arguments.
 */
const useStore = (initialState) => {
  const reducer = (state, action) =>
    is.function(action) ? action(state) : action
  return useReducer(reducer, initialState)
}

/**
 * The `useReducer` function in JavaScript is used to manage state and actions.
 *
 * @param reducer - The `reducer` parameter in the `useReducer` function is a function that specifies
 * how the state should be updated in response to an action. It takes the current state and an action
 * as arguments and returns the new state based on the action.
 * @param initialState - The `initialState` parameter in the `useReducer` function represents the
 * initial state of the reducer. It is the state that will be used when the reducer is first called or
 * when the state needs to be reset. This initial state can be a simple value, an object, an array, or
 * @param init - The `init` parameter in the `useReducer` function is an optional function that can be
 * used to initialize the state. If provided, it will be called with the `initialState` as its argument
 * and the return value will be used as the initial state for the reducer. If `init`
 * @returns An array containing the current state and the dispatch function is being returned.
 */
const useReducer = (reducer, initialState, init) => {
  validateHookCall()

  const state = getState()
  const { wipFiber, hookIndex } = state
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_STORE,
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    queue: [],
  }

  if (oldHook?.queue) {
    oldHook.queue.forEach((action) => {
      try {
        hook.state = reducer(hook.state, action)
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in reducer:', error)
        }
      }
    })
  }

  const dispatch = (action) => {
    if (action === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('dispatch called with undefined action')
      }
      return
    }

    hook.queue.push(action)

    const currentState = getState()
    currentState.wipRoot = {
      dom: currentState.currentRoot.dom,
      props: currentState.currentRoot.props,
      alternate: currentState.currentRoot,
    }
    currentState.deletions = []
    currentState.hookIndex = 0
    scheduleWork(currentState.wipRoot)
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return [hook.state, dispatch]
}

/**
 * The `useEffect` function in JavaScript is used to manage side effects in functional components by
 * comparing dependencies and executing a callback function when dependencies change.
 * @param callback - The `callback` parameter in the `useEffect` function is a function that will be
 * executed as the effect. This function can perform side effects like data fetching, subscriptions, or
 * DOM manipulations.
 * @param deps - The `deps` parameter in the `useEffect` function stands for dependencies. It is an
 * optional array that contains values that the effect depends on. The effect will only re-run if any
 * of the values in the `deps` array have changed since the last render. If the `deps` array
 */
const useEffect = (callback, deps) => {
  validateHookCall()

  if (!is.function(callback)) {
    throw new Error('useEffect callback must be a function')
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error('useEffect dependencies must be an array or undefined')
  }

  const state = getState()
  const { wipFiber, hookIndex } = state
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hasChanged = haveDepsChanged(oldHook?.deps, deps)

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    effect: hasChanged ? callback : null,
    cancel: oldHook?.cancel,
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
}

/**
 * The useRef function in JavaScript creates a reference object with an initial value for use in functional components.
 * @param initialValue - The `initialValue` parameter in the `useRef` function represents the initial
 * value that will be assigned to the `current` property of the reference object. This initial value
 * will be used if there is no previous value stored in the hook.
 * @returns The `useRef` function is returning the `current` property of the `hook.value` object, which
 * contains the initial value passed to the `useRef` function.
 */
const useRef = (initialValue) => {
  validateHookCall()

  const state = getState()
  const { wipFiber, hookIndex } = state
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? oldHook.value : { current: initialValue },
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return hook.value
}

/**
 * The useMemo function in JavaScript is used to memoize the result of a computation based on
 * dependencies.
 * @param compute - The `compute` parameter in the `useMemo` function is a callback function that
 * calculates the value that `useMemo` will memoize and return. This function will be called to compute
 * the memoized value when necessary.
 * @param deps - The `deps` parameter in the `useMemo` function refers to an array of dependencies.
 * These dependencies are used to determine whether the memoized value needs to be recalculated or if
 * the previously calculated value can be reused. The `useMemo` hook will recompute the memoized value
 * only if
 * @returns The `useMemo` function is returning the `value` calculated by the `compute` function.
 */
const useMemo = (compute, deps) => {
  validateHookCall()

  if (!is.function(compute)) {
    throw new Error('useMemo callback must be a function')
  }
  if (!Array.isArray(deps)) {
    throw new Error('useMemo requires a dependencies array')
  }

  const state = getState()
  const { wipFiber, hookIndex } = state
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  let value
  if (oldHook && !haveDepsChanged(oldHook.deps, deps)) {
    value = oldHook.value
  } else {
    try {
      value = compute()
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error in useMemo computation:', error)
      }
      value = undefined
    }
  }

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_MEMO,
    value,
    deps,
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return value
}

/**
 * The useCallback function in JavaScript ensures that a callback function is memoized based on its
 * dependencies.
 * @param callback - A function that you want to memoize and return for later use.
 * @param deps - The `deps` parameter in the `useCallback` function refers to an array of dependencies.
 * These dependencies are used to determine when the callback function should be re-evaluated and
 * memoized. If any of the dependencies change, the callback function will be re-executed and the
 * memoized value will
 * @returns The useCallback function is returning the memoized version of the callback function passed
 * as the first argument, based on the dependencies array provided as the second argument.
 */
const useCallback = (callback, deps) => {
  if (!is.function(callback)) {
    throw new Error('useCallback requires a function as first argument')
  }
  return useMemo(() => callback, deps)
}

/**
 * The createContext function creates a context provider and useContext hook in JavaScript.
 * @param [contextId] - The `contextId` parameter in the `createContext` function is used to specify
 * the unique identifier for the context being created. It defaults to `RYUNIX_TYPES.RYUNIX_CONTEXT` if
 * not provided.
 * @param [defaultValue] - The `defaultValue` parameter in the `createContext` function is used to
 * specify the default value that will be returned by the `useContext` hook if no provider is found in
 * the component tree. It is an optional parameter, and if not provided, an empty object `{}` will be
 * used as
 * @returns The `createContext` function returns an object with two properties: `Provider` and
 * `useContext`. The `Provider` property is a component that accepts `children` and `value` props, and
 * sets the `_contextId` and `_contextValue` properties on the element. The `useContext` property is a
 * hook function that retrieves the context value based on the context ID provided, or
 */
const createContext = (
  contextId = RYUNIX_TYPES.RYUNIX_CONTEXT,
  defaultValue = {},
) => {
  const Provider = ({ children, value }) => {
    const element = Fragment({ children })
    element._contextId = contextId
    element._contextValue = value
    return element
  }

  Provider._contextId = contextId

  const useContext = (ctxID = contextId) => {
    validateHookCall()

    const state = getState()
    let fiber = state.wipFiber

    while (fiber) {
      if (fiber._contextId === ctxID && fiber._contextValue !== undefined) {
        return fiber._contextValue
      }
      if (
        fiber.type?._contextId === ctxID &&
        fiber.props?.value !== undefined
      ) {
        return fiber.props.value
      }
      fiber = fiber.parent
    }
    return defaultValue
  }

  return { Provider, useContext }
}

/**
 * The `useQuery` function extracts query parameters from the URL in a browser environment.
 * @returns An object containing the query parameters from the current URL is being returned.
 */
const useQuery = () => {
  if (typeof window === 'undefined') return {}

  const searchParams = new URLSearchParams(window.location.search)
  const query = {}
  for (const [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}

/**
 * The function `useHash` in JavaScript is used to manage and update the hash portion of the URL in a
 * web application.
 * @returns The `useHash` function returns the current hash value from the window's location. If the
 * window is undefined (e.g., in a server-side environment), it returns an empty string. The function
 * also sets up an event listener to update the hash value when the hash in the URL changes and removes
 * the event listener when the component unmounts.
 */
const useHash = () => {
  if (typeof window === 'undefined') return ''

  const [hash, setHash] = useStore(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

/**
 * The `useMetadata` function in JavaScript is used to dynamically update metadata tags in the document
 * head based on provided tags and options.
 * @param [tags] - The `tags` parameter in the `useMetadata` function is an object that contains
 * metadata information for the webpage. It can include properties like `pageTitle`, `canonical`, and
 * other custom metadata tags like `og:title`, `og:description`, `twitter:title`,
 * `twitter:description`, etc. These tags
 * @param [options] - The `options` parameter in the `useMetadata` function is an object that can
 * contain the following properties:
 * - `title`: An object that can have the following properties:
 *  - `template`: A string that defines the template for the page title. It can include a placeholder
 * `%s` that will be replaced with the actual page title.
 * - `prefix`: A string that will be used as the default title if no specific page title is provided.
 * @returns The `useMetadata` function does not return anything. It is a custom hook that updates the
 * document's metadata (such as title and meta tags) based on the provided `tags` and `options` whenever
 * they change.
 * This hook can't be reached by google crawler.
 */

const useMetadata = (tags = {}, options = {}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return

    let finalTitle = 'Ryunix App'
    const template = options.title?.template
    const defaultTitle = options.title?.prefix || 'Ryunix App'
    const pageTitle = tags.pageTitle || tags.title

    if (is.string(pageTitle) && pageTitle.trim()) {
      finalTitle = template?.includes('%s')
        ? template.replace('%s', pageTitle)
        : pageTitle
    } else {
      finalTitle = defaultTitle
    }

    document.title = finalTitle

    if (tags.canonical) {
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', tags.canonical)
    }

    Object.entries(tags).forEach(([key, value]) => {
      if (['title', 'pageTitle', 'canonical'].includes(key)) return

      const isProperty = key.startsWith('og:') || key.startsWith('twitter:')
      const selector = `meta[${isProperty ? 'property' : 'name'}='${key}']`
      let meta = document.head.querySelector(selector)

      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(isProperty ? 'property' : 'name', key)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', value)
    })
  }, [JSON.stringify(tags), JSON.stringify(options)])
}

// Router Context
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
    if (route.path === '*') return notFound
    if (!route.path || typeof route.path !== 'string') continue

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

/**
 * The `RouterProvider` component manages routing in a Ryunix application by updating the location based
 * on window events and providing context for the current route.
 * @returns The `RouterProvider` component is returning a `RouterContext.Provider` component with a
 * `value` prop set to `contextValue`, and wrapping the `children` within a `Fragment`.
 */
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
  }, [location])

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
    Fragment({ children }),
  )
}

/**
 * The function `useRouter` returns the context of the Router for navigation in a Ryunix application.
 * @returns The `useRouter` function is returning the result of calling
 * `RouterContext.useContext('ryunix.navigation')`. This function is likely attempting to retrieve the
 * navigation context from the RouterContext.
 */
const useRouter = () => {
  return RouterContext.useContext('ryunix.navigation')
}

/**
 * The `Children` function in JavaScript uses router hooks to handle scrolling to a specific element
 * based on the hash in the URL.
 * @returns The `Children` component is returning the result of calling `createElement` with
 * `route.component` as the first argument and an object with `key`, `params`, `query`, and `hash`
 * properties as the second argument. The `key` property is set to `location`, and the `params`,
 * `query`, and `hash` properties are passed as values from the component's props.
 */
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

/**
 * The NavLink function in JavaScript is a component that generates a link element with customizable
 * classes and active state based on the current location.
 * @returns The `NavLink` component is returning a JSX element representing an anchor (`<a>`) tag with
 * the following attributes and properties:
 */
const NavLink = ({ to, exact = false, ...props }) => {
  const { location, navigate } = useRouter()
  const isActive = exact ? location === to : location.startsWith(to)

  const resolveClass = (cls) =>
    typeof cls === 'function' ? cls({ isActive }) : cls || ''

  const handleClick = (e) => {
    e.preventDefault()
    navigate(to)
  }

  const classAttrName = props['ryunix-class'] ? 'ryunix-class' : 'className'
  const classAttrValue = resolveClass(
    props['ryunix-class'] || props['className'],
  )

  const {
    ['ryunix-class']: _omitRyunix,
    className: _omitClassName,
    ...cleanedProps
  } = props

  return createElement(
    'a',
    {
      href: to,
      onClick: handleClick,
      [classAttrName]: classAttrValue,
      ...cleanedProps,
    },
    props.children,
  )
}

/**
 * useStore with priority support
 */
const useStorePriority = (initialState) => {
  const reducer = (state, action) =>
    typeof action === 'function' ? action.value(state) : action.value

  const [state, baseDispatch] = useReducer(reducer, initialState)

  const dispatch = (action, priority = Priority.NORMAL) => {
    const wrappedAction = {
      value: action,
      priority,
    }

    baseDispatch(wrappedAction)
  }

  return [state, dispatch]
}

/**
 * useTransition - Mark updates as non-urgent
 */
const useTransition = () => {
  const [isPending, setIsPending] = useStorePriority(false)

  const startTransition = (callback) => {
    setIsPending(true, Priority.IMMEDIATE)

    setTimeout(() => {
      callback()
      setIsPending(false, Priority.IMMEDIATE)
    }, 0)
  }

  return [isPending, startTransition]
}

/**
 * useDeferredValue - Defer value updates
 */
const useDeferredValue = (value) => {
  const [deferredValue, setDeferredValue] = useStorePriority(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredValue(value, Priority.LOW)
    }, 100)

    return () => clearTimeout(timeout)
  }, [value])

  return deferredValue
}

export {
  useStore,
  useReducer,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  createContext,
  useQuery,
  useHash,
  useMetadata,
  useStorePriority,
  useTransition,
  useDeferredValue,
  // Router exports
  RouterProvider,
  useRouter,
  Children,
  NavLink,
}
