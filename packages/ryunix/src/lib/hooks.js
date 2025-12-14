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

const useStore = (initialState) => {
  const reducer = (state, action) =>
    is.function(action) ? action(state) : action
  return useReducer(reducer, initialState)
}

const useReducer = (reducer, initialState, init) => {
  validateHookCall()

  const state = getState()
  const { wipFiber, hookIndex } = state
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex]

  const hook = {
    hookID: hookIndex,
    type: RYUNIX_TYPES.RYUNIX_STORE,
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    queue: [], // Siempre nueva cola vacía
  }

  // Procesar acciones del render anterior
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
