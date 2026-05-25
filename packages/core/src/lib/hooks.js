import { RYUNIX_TYPES, getState, is, flattenArray } from '../utils/index.js'
import { createElement, Fragment } from './createElement.js'
import { scheduleWork } from './bridge.js'
import {
  Priority,
  scheduleUpdate,
  runWithPriority,
  getCurrentPriority,
} from './priority.js'
import { queueUpdate } from './batching.js'
import { validateHookContext as validateHookCall } from './devtools.js'
const haveDepsChanged = (oldDeps, newDeps) => {
  if (!oldDeps || !newDeps) return true
  if (oldDeps.length !== newDeps.length) return true
  return oldDeps.some((dep, i) => !Object.is(dep, newDeps[i]))
}
const useStore = (initialState, priority = getCurrentPriority()) => {
  if (typeof window === 'undefined') {
    return [is.function(initialState) ? initialState() : initialState, () => {}]
  }
  const state = getState()
  if (state.isServerRendering) {
    return [is.function(initialState) ? initialState() : initialState, () => {}]
  }
  const reducer = (state, action) =>
    is.function(action) ? action(state) : action
  return useReducer(reducer, initialState, undefined, priority)
}
const useReducer = (
  reducer,
  initialState,
  init,
  defaultPriority = getCurrentPriority(),
) => {
  if (typeof window === 'undefined') {
    return [init ? init(initialState) : initialState, () => {}]
  }
  const state = getState()
  if (state.isServerRendering) {
    return [init ? init(initialState) : initialState, () => {}]
  }
  validateHookCall()
  const { hookIndex } = state
  const wipFiber = state.wipFiber
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
  const dispatch = (action, priority = defaultPriority) => {
    if (action === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('dispatch called with undefined action')
      }
      return
    }
    hook.queue.push(action)
    const currentState = getState()
    const activeRoot = currentState.currentRoot || currentState.wipRoot
    if (!activeRoot) return
    const newRoot = {
      dom: activeRoot.dom,
      props: activeRoot.props,
      alternate: currentState.currentRoot || null,
    }
    queueUpdate(() => scheduleWork(newRoot, priority))
  }
  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return [hook.state, dispatch]
}
const useEffect = (callback, deps) => {
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
  const wipFiber = state.wipFiber
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
const useRef = (initialValue) => {
  if (typeof window === 'undefined') {
    return { current: initialValue }
  }
  const state = getState()
  if (state.isServerRendering) {
    return { current: initialValue }
  }
  validateHookCall()
  const { hookIndex } = state
  const wipFiber = state.wipFiber
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
const useMemo = (compute, deps) => {
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
  const wipFiber = state.wipFiber
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
      throw error
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
const useCallback = (callback, deps) => {
  if (!is.function(callback)) {
    throw new Error('useCallback requires a function as first argument')
  }
  return useMemo(() => callback, deps)
}
const createContext = (
  contextId = RYUNIX_TYPES.RYUNIX_CONTEXT,
  defaultValue = {},
) => {
  const Provider = ({ value, children }) => {
    return createElement(
      RYUNIX_TYPES.RYUNIX_CONTEXT,
      { value, children, _contextId: contextId },
      ...flattenArray([children]),
    )
  }
  Provider._contextId = contextId
  const useContext = (ctxID = contextId) => {
    const state = getState()
    if (state.isServerRendering) {
      const ssrContexts = state.ssrContexts
      return ssrContexts && ssrContexts[ctxID] !== undefined
        ? ssrContexts[ctxID]
        : defaultValue
    }
    validateHookCall()
    let fiber = state.wipFiber
    while (fiber) {
      if (fiber._contextId === ctxID && fiber._contextValue !== undefined) {
        return fiber._contextValue
      }
      const fiberType = fiber.type
      if (fiberType?._contextId === ctxID && fiber.props?.value !== undefined) {
        return fiber.props.value
      }
      fiber = fiber.parent
    }
    return defaultValue
  }
  return {
    Provider: Provider,
    useContext,
  }
}
const useQuery = () => {
  if (typeof window === 'undefined') return {}
  const searchParams = new URLSearchParams(window.location.search)
  const query = {}
  for (const [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}
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
const useMetadata = (tags = {}, options = {}) => {
  const state = getState()
  if (state.isServerRendering) {
    state.ssrMetadata = { ...state.ssrMetadata, ...tags }
    return
  }
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
const RouterContext = createContext('ryunix.navigation', {
  location: '/',
  params: {},
  query: {},
  navigate: (_path) => {},
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
      `^${route.path.replace(/:(\.\.\.)?(\w+)/g, (match, isCatchAll, key) => {
        keys.push({ key, isCatchAll: !!isCatchAll })
        return isCatchAll ? '(.+)' : '([^/]+)'
      })}$`,
    )
    const matchPath = pathname.match(pattern)
    if (matchPath) {
      const params = keys.reduce((acc, keyObj, index) => {
        const val = matchPath[index + 1]
        acc[keyObj.key] = keyObj.isCatchAll && val ? val.split('/') : val
        return acc
      }, {})
      return { route, params }
    }
  }
  return notFound
}
const getSsrPathname = () => {
  const pathname = globalThis?.window?.location?.pathname
  if (typeof pathname === 'string' && pathname) {
    return pathname.split('?')[0].split('#')[0]
  }
  return '/'
}
const RouterProvider = ({ routes, children }) => {
  if (typeof window === 'undefined') {
    const location = getSsrPathname()
    const currentRouteData = findRoute(routes, location)
    const contextValue = {
      location,
      params: currentRouteData.params || {},
      query: {},
      navigate: () => {},
      route: currentRouteData.route,
    }
    return createElement(
      RouterContext.Provider,
      { value: contextValue },
      Fragment({ children }),
    )
  }
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
    if (typeof window !== 'undefined' && window.__RYUNIX_MPA__) {
      window.location.assign(path)
      return
    }
    window.history.pushState({}, '', path)
    setLocation(path)
  }
  const currentRouteData = findRoute(routes, location)
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
    location,
  })
}
const usePathname = () => {
  const { location } = useRouter()
  return location.split('?')[0].split('#')[0]
}
const useSearchParams = () => {
  const { query } = useRouter()
  return new URLSearchParams(query)
}
const Link = ({ to, prefetch = true, ...props }) => {
  const { navigate } = useRouter()
  const handleClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return
    }
    e.preventDefault()
    navigate(to)
  }
  const handleMouseEnter = () => {
    if (prefetch && typeof window !== 'undefined') {
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
const NavLink = ({ to, exact = false, ...props }) => {
  const { location, navigate } = useRouter()
  const isActive = exact ? location === to : location.startsWith(to)
  const resolveClass = (cls) =>
    typeof cls === 'function' ? cls({ isActive }) : cls || ''
  const handleClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return
    }
    e.preventDefault()
    navigate(to)
  }
  const classAttrName = props['ryunix-class'] ? 'ryunix-class' : 'className'
  const classAttrValue = resolveClass(props['ryunix-class'] || props.className)
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
const useStorePriority = (initialState) => {
  const reducer = (state, action) =>
    typeof action === 'function' ? action.value(state) : action.value
  const [state, baseDispatch] = useReducer(reducer, initialState, undefined)
  const dispatch = (action, priority = Priority.NORMAL) => {
    const wrappedAction = {
      value: action,
      priority,
    }
    scheduleUpdate(() => baseDispatch(wrappedAction, priority), priority)
  }
  return [state, dispatch]
}
const useTransition = () => {
  const [isPending, setIsPending] = useStorePriority(false)
  const startTransition = (callback) => {
    setIsPending(true, Priority.IMMEDIATE)
    setTimeout(() => {
      runWithPriority(Priority.LOW, () => {
        callback()
        setIsPending(false, Priority.LOW)
      })
    }, 0)
  }
  return [isPending, startTransition]
}
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
const usePersistentStore = (key, initialState = '') => {
  const [state, dispatch] = useStore(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialState
    } catch (error) {
      return initialState
    }
  })
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
const useSwitch = (initialState = false) => {
  const [state, dispatch] = useStore(initialState)
  const toggle = () => {
    dispatch((prev) => !prev)
  }
  return [state, toggle]
}
const useLayoutEffect = (callback, deps) => {
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
  const wipFiber = state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hasChanged = haveDepsChanged(oldHook?.deps, deps)
  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    effect: hasChanged ? callback : null,
    cancel: oldHook?.cancel,
    isLayout: true,
  }
  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
}
let idCounter = 0
const resetIdCounter = () => {
  idCounter = 0
}
const useId = () => {
  const state = getState()
  if (state.isServerRendering) {
    return `:r${idCounter++}:`
  }
  validateHookCall()
  const { hookIndex } = state
  const wipFiber = state.wipFiber
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? oldHook.value : `:r${idCounter++}:`,
  }
  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return hook.value
}
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
const useThrottle = (value, interval = 300) => {
  const [throttledValue, setThrottledValue] = useStore(value)
  const lastUpdated = useRef(Date.now())
  useEffect(() => {
    const now = Date.now()
    const elapsed = now - lastUpdated.current
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
  usePersistentStore as usePersitentStore,
  useSwitch,
  RouterProvider,
  useRouter,
  Children,
  NavLink,
  Link,
  usePathname,
  useSearchParams,
}
