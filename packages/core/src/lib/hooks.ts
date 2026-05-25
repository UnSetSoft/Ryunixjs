import { RYUNIX_TYPES, getState, is, flattenArray } from '../utils/index.js'
import { createElement, Fragment } from './createElement.js'
import { scheduleWork } from './bridge.js'
import {
  Priority,
  scheduleUpdate,
  runWithPriority,
  getCurrentPriority,
} from './priority.js'
import { RYUNIX_PORTAL } from './portal.js'
import { queueUpdate } from './batching.js'
import { validateHookContext as validateHookCall } from './devtools.js'

/**
 * @typedef {import('../types/internal.js').RyunixFiber} RyunixFiber
 * @typedef {import('../types/internal.js').RyunixHook} RyunixHook
 * @typedef {import('../types/internal.js').RyunixRoute} RyunixRoute
 * @typedef {import('../types/internal.js').RyunixRouterContextValue} RyunixRouterContextValue
 * @typedef {import('../types/internal.js').RyunixMetadataTags} RyunixMetadataTags
 * @typedef {import('../types/internal.js').RyunixMetadataOptions} RyunixMetadataOptions
 * @typedef {import('../types/internal.js').RyunixRootFiber} RyunixRootFiber
 * @typedef {import('../types/internal.js').RyunixComponent} RyunixComponent
 */

/**
 * @typedef {{ route: RyunixRoute | { component: RyunixComponent | null }, params: Record<string, string | string[]> }} RouteMatch
 */

/**
 * @param {unknown[] | undefined} oldDeps
 * @param {unknown[] | undefined} newDeps
 * @returns {boolean}
 */
const haveDepsChanged = (oldDeps, newDeps) => {
  if (!oldDeps || !newDeps) return true
  if (oldDeps.length !== newDeps.length) return true
  return oldDeps.some((dep, i) => !Object.is(dep, newDeps[i]))
}

/**
 * @param {unknown} initialState
 * @param {number} [priority]
 * @returns {[unknown, (action: unknown, priority?: number) => void]}
 */
const useStore = (initialState, priority = getCurrentPriority()) => {
  // SSR safety check - more reliable than state.isServerRendering
  if (typeof window === 'undefined') {
    return [
      is.function(initialState)
        ? /** @type {() => unknown} */ initialState()
        : initialState,
      () => {},
    ]
  }

  const state = getState()
  if (state.isServerRendering) {
    return [
      is.function(initialState)
        ? /** @type {() => unknown} */ initialState()
        : initialState,
      () => {},
    ]
  }

  /**
   * @param {unknown} state
   * @param {unknown} action
   */
  const reducer = (state: unknown, action: unknown) =>
    is.function(action) ? (action as (s: unknown) => unknown)(state) : action
  return useReducer(reducer, initialState, undefined, priority)
}

/**
 * @param {(state: unknown, action: unknown) => unknown} reducer
 * @param {unknown} initialState
 * @param {((initial: unknown) => unknown)=} [init]
 * @param {number} [defaultPriority]
 * @returns {[unknown, (action: unknown, priority?: number) => void]}
 */
const useReducer = (
  reducer,
  initialState,
  init,
  defaultPriority = getCurrentPriority(),
) => {
  // SSR safety check - more reliable than state.isServerRendering
  if (typeof window === 'undefined') {
    return [init ? init(initialState) : initialState, () => {}]
  }

  const state = getState()
  if (state.isServerRendering) {
    return [init ? init(initialState) : initialState, () => {}]
  }

  validateHookCall()

  const { hookIndex } = state
  const wipFiber = /** @type {RyunixFiber} */ state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_STORE,
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    queue: /** @type {unknown[]} */ [],
  }

  if (oldHook?.queue) {
    oldHook.queue.forEach(
      /** @param {unknown} action */ (action) => {
        try {
          hook.state = reducer(hook.state, action)
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in reducer:', error)
          }
        }
      },
    )
  }

  /** @param {unknown} action @param {number} [priority] */
  const dispatch = (action, priority = defaultPriority) => {
    if (action === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('dispatch called with undefined action')
      }
      return
    }

    hook.queue.push(action)

    const currentState = getState()
    const activeRoot =
      /** @type {RyunixRootFiber | null | undefined} */ currentState.currentRoot ||
      currentState.wipRoot

    if (!activeRoot) return

    const newRoot = /** @type {RyunixRootFiber} */ {
      dom: activeRoot.dom,
      props: activeRoot.props,
      alternate:
        /** @type {RyunixRootFiber | null} */ currentState.currentRoot || null,
    }
    queueUpdate(() => scheduleWork(newRoot, priority))
  }

  wipFiber.hooks[hookIndex] = hook as import('../types/internal.js').RyunixHook
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
 * @param {() => void | (() => void)} callback
 * @param {unknown[] | undefined} deps
 * @returns {void}
 */
const useEffect = (callback, deps) => {
  // SSR safety check - more reliable than state.isServerRendering
  if (typeof window === 'undefined') {
    return
  }

  const state = getState()
  if (state.isServerRendering) {
    return
  }

  validateHookCall()

  if (!is.function(callback)) {
    throw new Error('useEffect callback must be a function')
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error('useEffect dependencies must be an array or undefined')
  }

  const { hookIndex } = state
  const wipFiber = /** @type {RyunixFiber} */ state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hasChanged = haveDepsChanged(oldHook?.deps, deps)

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    effect: hasChanged ? callback : null,
    cancel: oldHook?.cancel,
  }

  wipFiber.hooks[hookIndex] = hook as import('../types/internal.js').RyunixHook
  state.hookIndex++
}

/**
 * The useRef function in JavaScript creates a reference object with an initial value for use in functional components.
 * @param initialValue - The `initialValue` parameter in the `useRef` function represents the initial
 * value that will be assigned to the `current` property of the reference object. This initial value
 * will be used if there is no previous value stored in the hook.
 * @param {unknown} initialValue
 * @returns {{ current: unknown }}
 */
const useRef = (initialValue) => {
  // SSR safety check - more reliable than state.isServerRendering
  if (typeof window === 'undefined') {
    return { current: initialValue }
  }

  const state = getState()
  if (state.isServerRendering) {
    return { current: initialValue }
  }

  validateHookCall()

  const { hookIndex } = state
  const wipFiber = /** @type {RyunixFiber} */ state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook
      ? /** @type {{ value: { current: unknown } }} */ oldHook.value
      : { current: initialValue },
  }

  wipFiber.hooks[hookIndex] = hook as import('../types/internal.js').RyunixHook
  state.hookIndex++
  return /** @type {{ current: unknown }} */ hook.value
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
 * @param {() => unknown} compute
 * @param {unknown[]} deps
 * @returns {unknown}
 */
const useMemo = (compute, deps) => {
  // SSR safety check - more reliable than state.isServerRendering
  if (typeof window === 'undefined') {
    return compute()
  }

  const state = getState()
  if (state.isServerRendering) {
    return compute()
  }

  validateHookCall()

  if (!is.function(compute)) {
    throw new Error('useMemo callback must be a function')
  }
  if (!Array.isArray(deps)) {
    throw new Error('useMemo requires a dependencies array')
  }

  const { hookIndex } = state
  const wipFiber = /** @type {RyunixFiber} */ state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  let value
  if (oldHook && !haveDepsChanged(oldHook.deps, deps)) {
    value = /** @type {{ value?: unknown }} */ oldHook.value
  } else {
    try {
      value = compute()
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error in useMemo computation:', error)
      }
      throw error
    }
  }

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_MEMO,
    value,
    deps,
  }

  wipFiber.hooks[hookIndex] = hook as import('../types/internal.js').RyunixHook
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
 * @param {(...args: never[]) => unknown} callback
 * @param {unknown[]} deps
 * @returns {(...args: never[]) => unknown}
 */
const useCallback = (callback, deps) => {
  if (!is.function(callback)) {
    throw new Error('useCallback requires a function as first argument')
  }
  return /** @type {(...args: never[]) => unknown} */ useMemo(
    () => callback,
    deps,
  )
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
 * @param {string | symbol} [contextId]
 * @param {unknown} [defaultValue]
 * @returns {{ Provider: RyunixComponent & { _contextId?: string | symbol }, useContext: (ctxID?: string | symbol) => unknown }}
 */
const createContext = (
  contextId: string | symbol = RYUNIX_TYPES.RYUNIX_CONTEXT,
  defaultValue: unknown = {},
) => {
  /** @param {{ value?: unknown, children?: import('../types/internal.js').RyunixNode }} props */
  const Provider = ({ value, children }) => {
    return createElement(
      RYUNIX_TYPES.RYUNIX_CONTEXT,
      { value, children, _contextId: contextId },
      ...flattenArray([children]),
    )
  }

  Provider._contextId = contextId

  /** @param {string | symbol} [ctxID] */
  const useContext = (ctxID = contextId) => {
    const state = getState()
    if (state.isServerRendering) {
      const ssrContexts =
        /** @type {Record<string | symbol, unknown> | undefined} */ state.ssrContexts
      return ssrContexts && ssrContexts[ctxID] !== undefined
        ? ssrContexts[ctxID]
        : defaultValue
    }

    validateHookCall()

    /** @type {RyunixFiber | null | undefined} */
    let fiber = /** @type {RyunixFiber} */ state.wipFiber

    while (fiber) {
      if (fiber._contextId === ctxID && fiber._contextValue !== undefined) {
        return fiber._contextValue
      }
      const fiberType = fiber.type as
        | import('../types/internal.js').RyunixComponent
        | undefined
      if (fiberType?._contextId === ctxID && fiber.props?.value !== undefined) {
        return fiber.props.value
      }
      fiber = fiber.parent
    }
    return defaultValue
  }

  return {
    Provider:
      /** @type {RyunixComponent & { _contextId?: string | symbol }} */ Provider,
    useContext,
  }
}

/**
 * The `useQuery` function extracts query parameters from the URL in a browser environment.
 * @returns {Record<string, string>}
 */
const useQuery = () => {
  if (typeof window === 'undefined') return {}

  const searchParams = new URLSearchParams(window.location.search)
  /** @type {Record<string, string>} */
  const query = {}
  for (const [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}

/**
 * The function `useHash` in JavaScript is used to manage and update the hash portion of the URL in a
 * web application.
 * @returns {string}
 */
const useHash = () => {
  if (typeof window === 'undefined') return ''

  const [hash, setHash] = useStore(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return /** @type {string} */ hash
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
 * This hook can't be reached by google crawler.
 * @param {RyunixMetadataTags} [tags]
 * @param {RyunixMetadataOptions} [options]
 * @returns {void}
 */

const useMetadata = (
  tags: import('../types/internal.js').RyunixMetadataTags = {},
  options: import('../types/internal.js').RyunixMetadataOptions = {},
) => {
  const state = getState()
  if (state.isServerRendering) {
    state.ssrMetadata = { ...state.ssrMetadata, ...tags }
    return
  }

  useEffect(() => {
    if (typeof document === 'undefined') return
    // ...

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
/** @type {ReturnType<typeof createContext>} */
const RouterContext = createContext(
  'ryunix.navigation',
  /** @type {RyunixRouterContextValue} */ {
    location: '/',
    params: {},
    query: {},
    /** @param {string} _path */
    navigate: (_path) => {},
    route: null,
  },
)

/**
 * @param {RyunixRoute[]} routes
 * @param {string} path
 * @returns {RouteMatch}
 */
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

    /** @type {{ key: string, isCatchAll: boolean }[]} */
    const keys = []
    const pattern = new RegExp(
      `^${route.path.replace(
        /:(\.\.\.)?(\w+)/g,
        (
          /** @type {string} */ match,
          /** @type {string | undefined} */ isCatchAll,
          /** @type {string} */ key,
        ) => {
          keys.push({ key, isCatchAll: !!isCatchAll })
          return isCatchAll ? '(.+)' : '([^/]+)'
        },
      )}$`,
    )

    const matchPath = pathname.match(pattern)
    if (matchPath) {
      const params = keys.reduce(
        (acc, keyObj, index) => {
          const val = matchPath[index + 1]
          acc[keyObj.key] = keyObj.isCatchAll && val ? val.split('/') : val
          return acc
        },
        /** @type {Record<string, string | string[]>} */ {},
      )
      return { route, params }
    }
  }
  return notFound
}

/**
 * @returns {string}
 */
const getSsrPathname = () => {
  const pathname = globalThis?.window?.location?.pathname
  if (typeof pathname === 'string' && pathname) {
    return pathname.split('?')[0].split('#')[0]
  }
  return '/'
}

/**
 * The `RouterProvider` component manages routing in a Ryunix application by updating the location based
 * on window events and providing context for the current route.
 * @param {{ routes: RyunixRoute[], children?: import('../types/internal.js').RyunixNode }} props
 * @returns {import('./createElement.js').RyunixElement}
 */
const RouterProvider = ({ routes, children }) => {
  // SSR: Return server-safe version without hooks
  if (typeof window === 'undefined') {
    const location = getSsrPathname()
    const currentRouteData = findRoute(routes, location)
    /** @type {RyunixRouterContextValue} */
    const contextValue = {
      location,
      params: currentRouteData.params || {},
      query: {},
      navigate: () => {},
      route: currentRouteData.route,
    }
    return createElement(
      /** @type {string | symbol | Function} */ RouterContext.Provider,
      { value: contextValue },
      Fragment({ children }),
    )
  }

  const [location, setLocation] =
    /** @type {[string, (action: unknown, priority?: number) => void]} */ useStore(
      window.location.pathname,
    )

  useEffect(() => {
    const update = () => setLocation(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])

  /** @param {string} path */
  const navigate = (path) => {
    if (typeof window !== 'undefined' && window.__RYUNIX_MPA__) {
      window.location.assign(path)
      return
    }
    window.history.pushState({}, '', path)
    setLocation(path)
  }

  const currentRouteData = findRoute(routes, location)
  const query = useQuery()

  /** @type {RyunixRouterContextValue} */
  const contextValue = {
    location,
    params: currentRouteData.params || {},
    query,
    navigate,
    route: currentRouteData.route,
  }

  return createElement(
    /** @type {string | symbol | Function} */ RouterContext.Provider,
    { value: contextValue },
    Fragment({ children }),
  )
}

/**
 * The function `useRouter` returns the context of the Router for navigation in a Ryunix application.
 * @returns {RyunixRouterContextValue}
 */
const useRouter =
  (): import('../types/internal.js').RyunixRouterContextValue => {
    return RouterContext.useContext(
      'ryunix.navigation',
    ) as import('../types/internal.js').RyunixRouterContextValue
  }

/**
 * The `Children` function in JavaScript uses router hooks to handle scrolling to a specific element
 * based on the hash in the URL.
 * @returns {import('./createElement.js').RyunixElement | null}
 */
const Children = () => {
  const { route, params, query, location } = useRouter()
  if (!route || !route.component) return null
  const hash = useHash()

  useEffect(() => {
    if (hash) {
      const id = /** @type {string} */ hash.slice(1)
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [hash])

  return createElement(
    /** @type {string | symbol | Function} */ route.component,
    {
      key: location,
      params,
      query,
      hash,
      location,
    },
  )
}

/**
 * usePathname - Returns the current pathname
 * @returns {string}
 */
const usePathname = () => {
  const { location } = useRouter()
  return location.split('?')[0].split('#')[0]
}

/**
 * useSearchParams - Returns the current URLSearchParams object
 * @returns {URLSearchParams}
 */
const useSearchParams = () => {
  const { query } = useRouter()
  return new URLSearchParams(query)
}

/**
 * Link - Base link component for SPA navigation
 * Supports optional prefetching of lazy components.
 * @param {{ to: string, prefetch?: boolean, children?: import('../types/internal.js').RyunixNode } & Record<string, unknown>} props
 * @returns {import('./createElement.js').RyunixElement}
 */
const Link = ({ to, prefetch = true, ...props }) => {
  const { navigate } = useRouter()

  /** @param {MouseEvent} e */
  const handleClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return
    }

    e.preventDefault()
    navigate(to)
  }

  const handleMouseEnter = () => {
    if (prefetch && typeof window !== 'undefined') {
      // Logic for prefetching could go here if route component is known
    }
  }

  const { className: _omitClassName, ...cleanedProps } = props

  return createElement(
    'a',
    {
      href: to,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      className: props.className || props['ryunix-class'],
      ...cleanedProps,
    },
    props.children,
  )
}

/**
 * The NavLink function in JavaScript is a component that generates a link element with customizable
 * classes and active state based on the current location.
 * @param {{ to: string, exact?: boolean, children?: import('../types/internal.js').RyunixNode } & Record<string, unknown>} props
 * @returns {import('./createElement.js').RyunixElement}
 */
const NavLink = ({ to, exact = false, ...props }) => {
  const { location, navigate } = useRouter()
  const isActive = exact ? location === to : location.startsWith(to)

  /** @param {string | ((args: { isActive: boolean }) => string) | undefined} cls */
  const resolveClass = (cls) =>
    typeof cls === 'function' ? cls({ isActive }) : cls || ''

  /** @param {MouseEvent} e */
  const handleClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return
    }
    e.preventDefault()
    navigate(to)
  }

  const classAttrName = props['ryunix-class'] ? 'ryunix-class' : 'className'
  const classAttrValue = resolveClass(
    /** @type {string | ((args: { isActive: boolean }) => string) | undefined} */ props[
      'ryunix-class'
    ] || props.className,
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
 * @param {unknown} initialState
 * @returns {[unknown, (action: unknown, priority?: number) => void]}
 */
const useStorePriority = (initialState) => {
  /** @param {unknown} state @param {{ value: unknown, priority?: number }} action */
  const reducer = (state, action) =>
    typeof action === 'function'
      ? /** @type {{ value: (s: unknown) => unknown }} */ action.value(state)
      : action.value

  const [state, baseDispatch] = useReducer(reducer, initialState, undefined)

  /** @param {unknown} action @param {number} [priority] */
  const dispatch = (action, priority = Priority.NORMAL) => {
    const wrappedAction = {
      value: action,
      priority,
    }

    scheduleUpdate(() => baseDispatch(wrappedAction, priority), priority)
  }

  return [state, dispatch]
}

/**
 * useTransition - Mark updates as non-urgent
 * @returns {[boolean, (callback: () => void) => void]}
 */
const useTransition = () => {
  const [isPending, setIsPending] = useStorePriority(false)

  /** @param {() => void} callback */
  const startTransition = (callback) => {
    setIsPending(true, Priority.IMMEDIATE)

    setTimeout(() => {
      runWithPriority(Priority.LOW, () => {
        callback()
        setIsPending(false, Priority.LOW)
      })
    }, 0)
  }

  return [/** @type {boolean} */ isPending, startTransition]
}

/**
 * useDeferredValue - Defer value updates
 * @param {unknown} value
 * @returns {unknown}
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

/**
 * The `usePersitentStore` function manages state using local storage in JavaScript, allowing for easy
 * storage and retrieval of data.
 * @param key - The `key` parameter in the `usePersitentStore` function is a string that represents the key
 * under which the data will be stored in the browser's local storage. It is used to retrieve and store
 * data associated with this specific key.
 * @param [initialState] - The `initialState` parameter in the `usePersitentStore` function is the initial
 * value that will be used if there is no data stored in the local storage under the specified `key`.
 * It serves as the default value for the state if no data is retrieved from the local storage.
 * @param {string} key
 * @param {unknown} [initialState]
 * @returns {[unknown, (value: unknown) => void]}
 */
const usePersistentStore = (key, initialState = '') => {
  const [state, dispatch] = useStore(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialState
    } catch (error) {
      return initialState
    }
  })

  /**
   * The function `setValue` dispatches a value and stores it in the local storage as a JSON string,
   * handling any errors with a console log.
   * @param value - The `value` parameter in the `setValue` function is the data that you want to set.
   * It is dispatched to update the state and then stored in the browser's local storage after being
   * converted to a JSON string.
   * @param {unknown} value
   */
  const setValue = (value) => {
    try {
      dispatch(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(error)
    }
  }

  return [state, setValue]
}

/**
 * The `useSwitch` function returns a state value and a toggle function to switch the state between
 * true and false.
 * @param [initialState=false] - The `initialState` parameter in the `useSwitch` function is used to
 * set the initial value of the state. If no value is provided when calling `useSwitch`, the default
 * initial state will be `false`.
 * @param {boolean} [initialState]
 * @returns {[boolean, () => void]}
 */
const useSwitch = (initialState = false) => {
  const [state, dispatch] = useStore(initialState)

  /**
   * The function `toggle` toggles the state by dispatching the opposite value of the current state.
   * Uses functional update to avoid stale closure issues with rapid calls.
   */
  const toggle = () => {
    dispatch(/** @param {boolean} prev */ (prev) => !prev)
  }

  return [/** @type {boolean} */ state, toggle]
}

/**
 * useLayoutEffect - Like useEffect but runs synchronously after DOM mutations
 * and before the browser paints. Use for DOM measurements.
 * @param {() => void | (() => void)} callback - Effect callback
 * @param {unknown[] | undefined} deps - Dependencies array
 * @returns {void}
 */
const useLayoutEffect = (callback, deps) => {
  // SSR safety check - more reliable than state.isServerRendering
  if (typeof window === 'undefined') {
    return
  }

  const state = getState()
  if (state.isServerRendering) {
    return
  }

  validateHookCall()

  if (!is.function(callback)) {
    throw new Error('useLayoutEffect callback must be a function')
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error(
      'useLayoutEffect dependencies must be an array or undefined',
    )
  }

  const { hookIndex } = state
  const wipFiber = /** @type {RyunixFiber} */ state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hasChanged = haveDepsChanged(oldHook?.deps, deps)

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    effect: hasChanged ? callback : null,
    cancel: oldHook?.cancel,
    isLayout: true, // Flag to run synchronously during commit
  }

  wipFiber.hooks[hookIndex] = hook as import('../types/internal.js').RyunixHook
  state.hookIndex++
}

// Counter for deterministic ID generation
let idCounter = 0

/**
 * Reset the idCounter for useId - call this before each SSR renderToString
 * to ensure deterministic IDs across multiple renders
 * @returns {void}
 */
const resetIdCounter = () => {
  idCounter = 0
}

/**
 * useId - Generate a deterministic, unique ID that is stable across SSR and hydration.
 * @returns {string} A unique ID string
 */
const useId = () => {
  const state = getState()

  if (state.isServerRendering) {
    // On server, use a simple incrementing counter (reset per renderToString call)
    return `:r${idCounter++}:`
  }

  validateHookCall()

  const { hookIndex } = state
  const wipFiber = /** @type {RyunixFiber} */ state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook
      ? /** @type {{ value: string }} */ oldHook.value
      : `:r${idCounter++}:`,
  }

  wipFiber.hooks[hookIndex] = hook as import('../types/internal.js').RyunixHook
  state.hookIndex++
  return /** @type {string} */ /** @type {{ value: string }} */ hook.value
}

/**
 * useDebounce - Returns a debounced version of the value that only updates
 * after the specified delay has passed since the last change.
 * @param {unknown} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {unknown} Debounced value
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useStore(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * useThrottle - Returns a throttled version of the value that only updates
 * at most once per specified interval.
 * @param {unknown} value - Value to throttle
 * @param {number} interval - Minimum interval in milliseconds (default: 300)
 * @returns {unknown} Throttled value
 */
const useThrottle = (value, interval = 300) => {
  const [throttledValue, setThrottledValue] = useStore(value)
  const lastUpdated = useRef(Date.now()) as { current: number }

  useEffect(() => {
    const now = Date.now()
    const elapsed = now - (lastUpdated.current as number)

    if (elapsed >= interval) {
      lastUpdated.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottledValue(value)
      }, interval - elapsed)

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

export {
  useStore,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  createContext,
  useQuery,
  useHash,
  useMetadata,
  useId,
  resetIdCounter,
  useDebounce,
  useThrottle,
  useStorePriority,
  useTransition,
  useDeferredValue,
  usePersistentStore,
  usePersistentStore as usePersitentStore, // backwards-compatible alias
  useSwitch,
  // Router exports
  RouterProvider,
  useRouter,
  Children,
  NavLink,
  Link,
  usePathname,
  useSearchParams,
}
