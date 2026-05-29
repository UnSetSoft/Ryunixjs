import { RYUNIX_TYPES, getState, is, flattenArray } from '../../utils/index.js'
import { createElement, Fragment } from '../reconciler/createElement.js'
import { scheduleWork } from '../reconciler/bridge.js'
import {
  Priority,
  scheduleUpdate,
  runWithPriority,
  getCurrentPriority,
} from '../reconciler/priority.js'
import { queueUpdate } from '../reconciler/batching.js'
import { validateHookContext as validateHookCall } from '../devtools/runtime.js'
import { mergeRouteMetadata } from './metadata.js'
import type {
  RyunixComponent,
  RyunixElement,
  RyunixFiber,
  RyunixHook,
  RyunixMetadataOptions,
  RyunixMetadataTags,
  RyunixNode,
  RyunixRootFiber,
  RyunixRoute,
  RyunixRouterContextValue,
} from '../../types/internal.js'

interface RouteMatch {
  route: RyunixRoute | { component: RyunixComponent | null }
  params: Record<string, string | string[]>
}

type DispatchFn = (action: unknown, priority?: number) => void
type ReducerFn = (state: unknown, action: unknown) => unknown

const haveDepsChanged = (
  oldDeps: unknown[] | undefined,
  newDeps: unknown[] | undefined,
): boolean => {
  if (!oldDeps || !newDeps) return true
  if (oldDeps.length !== newDeps.length) return true
  return oldDeps.some((dep, i) => !Object.is(dep, newDeps[i]))
}

const useStore = (
  initialState: unknown,
  priority: number = getCurrentPriority(),
): [unknown, DispatchFn] => {
  if (typeof window === 'undefined') {
    return [
      is.function(initialState)
        ? (initialState as () => unknown)()
        : initialState,
      () => {},
    ]
  }

  const state = getState()
  if (state.isServerRendering) {
    return [
      is.function(initialState)
        ? (initialState as () => unknown)()
        : initialState,
      () => {},
    ]
  }

  const reducer: ReducerFn = (state, action) =>
    is.function(action) ? (action as (s: unknown) => unknown)(state) : action
  return useReducer(reducer, initialState, undefined, priority)
}

const useReducer = (
  reducer: ReducerFn,
  initialState: unknown,
  init?: (initial: unknown) => unknown,
  defaultPriority: number = getCurrentPriority(),
): [unknown, DispatchFn] => {
  if (typeof window === 'undefined') {
    return [init ? init(initialState) : initialState, () => {}]
  }

  const state = getState()
  if (state.isServerRendering) {
    return [init ? init(initialState) : initialState, () => {}]
  }

  validateHookCall()

  const { hookIndex } = state
  const wipFiber = state.wipFiber!
  if (!wipFiber.hooks) wipFiber.hooks = []
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook: RyunixHook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_STORE,
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    queue: [] as unknown[],
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

  const dispatch: DispatchFn = (action, priority = defaultPriority) => {
    if (action === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('dispatch called with undefined action')
      }
      return
    }

    hook.queue!.push(action)

    const currentState = getState()
    const activeRoot =
      (currentState.currentRoot as RyunixRootFiber | null | undefined) ||
      currentState.wipRoot

    if (!activeRoot) return

    const newRoot: RyunixRootFiber = {
      dom: activeRoot.dom,
      props: activeRoot.props,
      alternate: (currentState.currentRoot as RyunixRootFiber | null) || null,
    }
    queueUpdate(() => scheduleWork(newRoot, priority))
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return [hook.state, dispatch]
}

const useEffect = (
  callback: () => void | (() => void),
  deps?: unknown[],
): void => {
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
  const wipFiber = state.wipFiber!
  if (!wipFiber.hooks) wipFiber.hooks = []
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hasChanged = haveDepsChanged(oldHook?.deps, deps)

  const hook: RyunixHook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    effect: hasChanged ? callback : null,
    cancel: oldHook?.cancel,
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
}

const useRef = <T>(initialValue: T): { current: T } => {
  if (typeof window === 'undefined') {
    return { current: initialValue }
  }

  const state = getState()
  if (state.isServerRendering) {
    return { current: initialValue }
  }

  validateHookCall()

  const { hookIndex } = state
  const wipFiber = state.wipFiber!
  if (!wipFiber.hooks) wipFiber.hooks = []
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook: RyunixHook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook
      ? (oldHook.value as { current: T })
      : { current: initialValue },
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return hook.value as { current: T }
}

const useMemo = <T>(compute: () => T, deps: unknown[]): T => {
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
  const wipFiber = state.wipFiber!
  if (!wipFiber.hooks) wipFiber.hooks = []
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  let value: T
  if (oldHook && !haveDepsChanged(oldHook.deps, deps)) {
    value = oldHook.value as T
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

  const hook: RyunixHook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_MEMO,
    value,
    deps,
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return value
}

const useCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  deps: unknown[],
): T => {
  if (!is.function(callback)) {
    throw new Error('useCallback requires a function as first argument')
  }
  return useMemo(() => callback, deps)
}

const createContext = <T>(
  contextId: string | symbol = RYUNIX_TYPES.RYUNIX_CONTEXT,
  defaultValue: T = {} as T,
) => {
  const Provider = ({
    value,
    children,
  }: {
    value?: unknown
    children?: RyunixNode
  }) => {
    return createElement(
      RYUNIX_TYPES.RYUNIX_CONTEXT,
      { value, children, _contextId: contextId },
      ...flattenArray([children]),
    )
  }

  Provider._contextId = contextId

  const useContext = (ctxID: string | symbol = contextId): unknown => {
    const state = getState()
    if (state.isServerRendering) {
      const ssrContexts = state.ssrContexts as
        | Record<string | symbol, unknown>
        | undefined
      return ssrContexts && ssrContexts[ctxID] !== undefined
        ? ssrContexts[ctxID]
        : defaultValue
    }

    validateHookCall()

    let fiber: RyunixFiber | null | undefined = state.wipFiber

    while (fiber) {
      if (fiber._contextId === ctxID && fiber._contextValue !== undefined) {
        return fiber._contextValue
      }
      const fiberType = fiber.type as RyunixComponent | undefined
      if (fiberType?._contextId === ctxID && fiber.props?.value !== undefined) {
        return fiber.props.value
      }
      fiber = fiber.parent
    }
    return defaultValue
  }

  return {
    Provider: Provider as RyunixComponent & { _contextId?: string | symbol },
    useContext,
  }
}

const useQuery = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}

  const searchParams = new URLSearchParams(window.location.search)
  const query: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}

const useHash = (): string => {
  if (typeof window === 'undefined') return ''

  const [hash, setHash] = useStore(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash as string
}

const useMetadata = (
  tags: RyunixMetadataTags = {},
  options: RyunixMetadataOptions = {},
): void => {
  const state = getState()
  if (state.isServerRendering) {
    state.ssrMetadata = mergeRouteMetadata(
      (state.ssrMetadata || {}) as Record<string, unknown>,
      tags as Record<string, unknown>,
    )
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
      if (value == null) return

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

const RouterContext = createContext<RyunixRouterContextValue>(
  'ryunix.navigation',
  {
    location: '/',
    params: {},
    query: {},
    navigate: (_path: string) => {},
    route: null,
  },
)

const findRoute = (routes: RyunixRoute[], path: string): RouteMatch => {
  const pathname = path.split('?')[0].split('#')[0]
  const notFoundRoute = routes.find((route) => route.NotFound)
  const notFound: RouteMatch = notFoundRoute
    ? { route: { component: notFoundRoute.NotFound ?? null }, params: {} }
    : { route: { component: null }, params: {} }

  for (const route of routes) {
    if (route.subRoutes) {
      const childRoute = findRoute(route.subRoutes, path)
      if (childRoute) return childRoute
    }
    if (route.path === '*') return notFound
    if (!route.path || typeof route.path !== 'string') continue

    const keys: { key: string; isCatchAll: boolean }[] = []
    const pattern = new RegExp(
      `^${route.path.replace(
        /:(\.\.\.)?(\w+)/g,
        (match: string, isCatchAll: string | undefined, key: string) => {
          keys.push({ key, isCatchAll: !!isCatchAll })
          return isCatchAll ? '(.+)' : '([^/]+)'
        },
      )}$`,
    )

    const matchPath = pathname.match(pattern)
    if (matchPath) {
      const params = keys.reduce<Record<string, string | string[]>>(
        (acc, keyObj, index) => {
          const val = matchPath[index + 1]
          acc[keyObj.key] = keyObj.isCatchAll && val ? val.split('/') : val
          return acc
        },
        {},
      )
      return { route, params }
    }
  }
  return notFound
}

const getSsrPathname = (): string => {
  const pathname = globalThis?.window?.location?.pathname
  if (typeof pathname === 'string' && pathname) {
    return pathname.split('?')[0].split('#')[0]
  }
  return '/'
}

const RouterProvider = ({
  routes,
  children,
}: {
  routes: RyunixRoute[]
  children?: RyunixNode
}): RyunixElement => {
  if (typeof window === 'undefined') {
    const location = getSsrPathname()
    const currentRouteData = findRoute(routes, location)
    const contextValue: RyunixRouterContextValue = {
      location,
      params: currentRouteData.params || {},
      query: {},
      navigate: () => {},
      route: currentRouteData.route as RyunixRoute | null,
    }
    return createElement(
      RouterContext.Provider as string | symbol | RyunixComponent,
      { value: contextValue },
      Fragment({ children }),
    )
  }

  const [location, setLocation] = useStore(window.location.pathname) as [
    string,
    DispatchFn,
  ]

  useEffect(() => {
    const update = () => setLocation(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])

  const navigate = (path: string) => {
    if (typeof window !== 'undefined' && window.__RYUNIX_MPA__) {
      window.location.assign(path)
      return
    }
    window.history.pushState({}, '', path)
    setLocation(path)
  }

  const currentRouteData = findRoute(routes, location as string)
  const query = useQuery()

  const contextValue: RyunixRouterContextValue = {
    location: location as string,
    params: currentRouteData.params || {},
    query,
    navigate,
    route: currentRouteData.route as RyunixRoute | null,
  }

  return createElement(
    RouterContext.Provider as string | symbol | RyunixComponent,
    { value: contextValue },
    Fragment({ children }),
  )
}

const useRouter = (): RyunixRouterContextValue => {
  return RouterContext.useContext(
    'ryunix.navigation',
  ) as RyunixRouterContextValue
}

const Children = (): RyunixElement | null => {
  const { route, params, query, location } = useRouter()
  if (!route || !route.component) return null
  const hash = useHash()

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      return
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [location, hash])

  return createElement(route.component as string | symbol | RyunixComponent, {
    params,
    query,
    hash,
    location,
  })
}

const usePathname = (): string => {
  const { location } = useRouter()
  return location.split('?')[0].split('#')[0]
}

const useSearchParams = (): URLSearchParams => {
  const { query } = useRouter()
  return new URLSearchParams(query)
}

const Link = ({
  to,
  prefetch = true,
  ...props
}: {
  to: string
  prefetch?: boolean
  children?: RyunixNode
} & Record<string, unknown>): RyunixElement => {
  const { navigate } = useRouter()

  const handleClick = (e: MouseEvent) => {
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
      className: (props.className || props['ryunix-class']) as string,
      ...cleanedProps,
    },
    props.children as RyunixNode,
  )
}

const NavLink = ({
  to,
  exact = false,
  ...props
}: {
  to: string
  exact?: boolean
  children?: RyunixNode
} & Record<string, unknown>): RyunixElement => {
  const { location, navigate } = useRouter()
  const isActive = exact ? location === to : location.startsWith(to)

  const resolveClass = (
    cls: string | ((args: { isActive: boolean }) => string) | undefined,
  ) => (typeof cls === 'function' ? cls({ isActive }) : cls || '')

  const handleClick = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return
    }
    e.preventDefault()
    navigate(to)
  }

  const classAttrName = props['ryunix-class'] ? 'ryunix-class' : 'className'
  const classAttrValue = resolveClass(
    (props['ryunix-class'] || props.className) as
      | string
      | ((args: { isActive: boolean }) => string)
      | undefined,
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
    props.children as RyunixNode,
  )
}

interface PriorityAction {
  value: unknown
  priority?: number
}

const useStorePriority = (initialState: unknown): [unknown, DispatchFn] => {
  const reducer = (state: unknown, action: unknown) =>
    typeof action === 'function'
      ? (action as unknown as { value: (s: unknown) => unknown }).value(state)
      : (action as PriorityAction).value

  const [state, baseDispatch] = useReducer(reducer, initialState, undefined)

  const dispatch: DispatchFn = (action, priority = Priority.NORMAL) => {
    const wrappedAction = {
      value: action,
      priority,
    }

    scheduleUpdate(() => baseDispatch(wrappedAction, priority), priority)
  }

  return [state, dispatch]
}

const useTransition = (): [boolean, (callback: () => void) => void] => {
  const [isPending, setIsPending] = useStorePriority(false)

  const startTransition = (callback: () => void) => {
    setIsPending(true, Priority.IMMEDIATE)

    setTimeout(() => {
      runWithPriority(Priority.LOW, () => {
        callback()
        setIsPending(false, Priority.LOW)
      })
    }, 0)
  }

  return [isPending as boolean, startTransition]
}

const useDeferredValue = <T>(value: T): T => {
  const [deferredValue, setDeferredValue] = useStorePriority(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredValue(value, Priority.LOW)
    }, 100)

    return () => clearTimeout(timeout)
  }, [value])

  return deferredValue as T
}

const usePersistentStore = (
  key: string,
  initialState: unknown = '',
): [unknown, (value: unknown) => void] => {
  const [state, dispatch] = useStore(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialState
    } catch (_error) {
      return initialState
    }
  })

  const setValue = (value: unknown) => {
    try {
      dispatch(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(error)
    }
  }

  return [state, setValue]
}

const useSwitch = (initialState = false): [boolean, () => void] => {
  const [state, dispatch] = useStore(initialState)

  const toggle = () => {
    dispatch((prev: boolean) => !prev)
  }

  return [state as boolean, toggle]
}

const useLayoutEffect = (
  callback: () => void | (() => void),
  deps?: unknown[],
): void => {
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
  const wipFiber = state.wipFiber!
  if (!wipFiber.hooks) wipFiber.hooks = []
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]
  const hasChanged = haveDepsChanged(oldHook?.deps, deps)

  const hook: RyunixHook = {
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

const resetIdCounter = (): void => {
  idCounter = 0
}

const useId = (): string => {
  const state = getState()

  if (state.isServerRendering) {
    return `:r${idCounter++}:`
  }

  validateHookCall()

  const { hookIndex } = state
  const wipFiber = state.wipFiber!
  if (!wipFiber.hooks) wipFiber.hooks = []
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook: RyunixHook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? (oldHook.value as string) : `:r${idCounter++}:`,
  }

  wipFiber.hooks[hookIndex] = hook
  state.hookIndex++
  return hook.value as string
}

const useDebounce = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useStore(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue as T
}

const useThrottle = <T>(value: T, interval = 300): T => {
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

  return throttledValue as T
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
