import { RYUNIX_TYPES, STRINGS, vars } from '../utils/index'
import { isEqual } from 'lodash'
import { createElement, Fragment } from './createElement'
import { scheduleWork } from './workers'
import { hasDepsChanged } from './effects'

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

/**
 * The `useReducer` function in JavaScript is used to manage state updates based on actions dispatched
 * to a reducer function.
 * @param reducer - The `reducer` parameter in the `useReducer` function is a function that takes the
 * current state and an action as arguments, and returns the new state based on the action. It is used
 * to update the state in response to different actions dispatched by the `dispatch` function.
 * @param initialState - The `initialState` parameter in the `useReducer` function represents the
 * initial state of the reducer. It is the state that will be used when the reducer is first
 * initialized or reset. This initial state can be any value or object that the reducer will operate on
 * and update based on the dispatched actions
 * @param init - The `init` parameter in the `useReducer` function is an optional function that can be
 * used to initialize the state. If provided, it will be called with the `initialState` as its argument
 * and the return value will be used as the initial state value. If `init` is not
 * @returns The `useReducer` function is returning an array with two elements: the current state and a
 * dispatch function.
 */
const useReducer = (reducer, initialState, init) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hook = {
    hookID: vars.hookIndex,
    type: RYUNIX_TYPES.RYUNIX_STORE,
    state: oldHook ? oldHook.state : init ? init(initialState) : initialState,
    queue: oldHook && Array.isArray(oldHook.queue) ? oldHook.queue.slice() : [],
  }

  if (oldHook && Array.isArray(oldHook.queue)) {
    oldHook.queue.forEach((action) => {
      hook.state = reducer(hook.state, action)
    })
  }

  const dispatch = (action) => {
    hook.queue.push(
      typeof action === STRINGS.function ? action : (prev) => action,
    )

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
 * useEffect seguro para SSR/SSG: no ejecuta efectos en el servidor.
 * @param effect - Función de efecto.
 * @param deps - Dependencias.
 */

const useEffect = (callback, deps) => {
  // No ejecutar efectos en SSR/SSG
  if (typeof window === 'undefined') {
    vars.hookIndex++
    return
  }

  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hasChanged = hasDepsChanged(oldHook?.deps, deps)

  const hook = {
    hookID: vars.hookIndex,
    type: RYUNIX_TYPES.RYUNIX_EFFECT,
    deps,
    effect: hasChanged ? callback : null,
    cancel: oldHook?.cancel,
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

// Proteger hooks que usan window/document
const useQuery = () => {
  if (typeof window === 'undefined') return {}
  const searchParams = new URLSearchParams(window.location.search)
  const query = {}
  for (let [key, value] of searchParams.entries()) {
    query[key] = value
  }
  return query
}

const useHash = () => {
  if (typeof window === 'undefined') return ''
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

/**
 * RouterProvider universal: acepta contexto externo (SSR/SSG) o usa window.location (SPA).
 * @param {Object} props - { routes, children, ssrContext }
 * @example
 *   // SSR/SSG:
 *   <RouterProvider routes={routes} ssrContext={{ location: '/about', query: { q: 'x' } }}>
 *     ...
 *   </RouterProvider>
 */
const RouterProvider = ({ routes, children, ssrContext }) => {
  // Si hay contexto externo (SSR/SSG), úsalo
  const isSSR = typeof window === 'undefined' || !!ssrContext
  const location = isSSR
    ? (ssrContext && ssrContext.location) || '/'
    : window.location.pathname
  const [loc, setLoc] = useStore(location)

  // SPA: escucha cambios de ruta
  useEffect(() => {
    if (isSSR) return
    const update = () => setLoc(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [loc])

  const navigate = (path) => {
    if (isSSR) return
    window.history.pushState({}, '', path)
    setLoc(path)
  }

  const currentRouteData = findRoute(routes, loc) || {}
  const query = isSSR ? (ssrContext && ssrContext.query) || {} : useQuery()

  const contextValue = {
    location: loc,
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
 * Universal useRouter: obtiene el contexto de ruta, compatible con SSR/SSG y SPA.
 * @returns {Object} { location, params, query, navigate, route }
 * @example
 *   const { location, params, query } = useRouter();
 */
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
 * useMetadata: Hook para gestionar dinámicamente metadatos SEO y recursos en <head>.
 * Ahora soporta title, meta, link, script, style y bloques personalizados en SSR/SSG.
 *
 * @param {Object} tags - Metadatos y recursos a insertar/actualizar.
 *   Soporta: title, canonical, meta, og:*, twitter:*, script, style, custom.
 *   - script/style/custom pueden ser string o array de strings (contenido o etiquetas completas).
 * @param {Object} options - Opcional. Permite definir template y default para el título.
 *
 * Ejemplo avanzado SSR/SSG:
 *   useMetadata({
 *     title: 'Mi página',
 *     description: 'Desc',
 *     script: [
 *       '<script src="/analytics.js"></script>',
 *       '<script>console.log("hi")</script>'
 *     ],
 *     style: '<style>body{background:#000}</style>',
 *     custom: '<!-- Bloque personalizado -->'
 *   })
 */
const useMetadata = (tags = {}, options = {}) => {
  // SSR/SSG: collect metadata in global context if available
  const ssrContext =
    typeof globalThis !== 'undefined' && globalThis.__RYUNIX_SSR_CONTEXT__
  if (ssrContext) {
    let finalTitle = ''
    let template = undefined
    let defaultTitle = 'Ryunix App'
    if (options.title && typeof options.title === 'object') {
      template = options.title.template
      if (typeof options.title.prefix === 'string') {
        defaultTitle = options.title.prefix
      }
    }
    let pageTitle = tags.pageTitle || tags.title
    if (typeof pageTitle === 'string') {
      if (pageTitle.trim() === '') {
        finalTitle = defaultTitle
      } else if (template && template.includes('%s')) {
        finalTitle = template.replace('%s', pageTitle)
      } else {
        finalTitle = pageTitle
      }
    } else if (typeof pageTitle === 'object' && pageTitle !== null) {
      finalTitle = defaultTitle
    } else if (!pageTitle) {
      finalTitle = defaultTitle
    }
    if (finalTitle) {
      ssrContext.head.push(`<title>${finalTitle}</title>`)
    }
    if (tags.canonical) {
      ssrContext.head.push(`<link rel="canonical" href="${tags.canonical}" />`)
    }
    Object.entries(tags).forEach(([key, value]) => {
      if (key === 'title' || key === 'pageTitle' || key === 'canonical') return
      if (key.startsWith('og:') || key.startsWith('twitter:')) {
        ssrContext.head.push(`<meta property="${key}" content="${value}" />`)
      } else {
        ssrContext.head.push(`<meta name="${key}" content="${value}" />`)
      }
    })
    // Soporte para script/style/custom
    if (tags.script) {
      ;(Array.isArray(tags.script) ? tags.script : [tags.script]).forEach(
        (s) => {
          ssrContext.head.push(s)
        },
      )
    }
    if (tags.style) {
      ;(Array.isArray(tags.style) ? tags.style : [tags.style]).forEach((s) => {
        ssrContext.head.push(s)
      })
    }
    if (tags.custom) {
      ;(Array.isArray(tags.custom) ? tags.custom : [tags.custom]).forEach(
        (c) => {
          ssrContext.head.push(c)
        },
      )
    }
    return
  }
  // SPA: fallback to DOM logic
  useEffect(() => {
    if (typeof document === 'undefined') return // SSR safe
    let finalTitle = ''
    let template = undefined
    let defaultTitle = 'Ryunix App'
    if (options.title && typeof options.title === 'object') {
      template = options.title.template
      if (typeof options.title.prefix === 'string') {
        defaultTitle = options.title.prefix
      }
    }
    let pageTitle = tags.pageTitle || tags.title
    if (typeof pageTitle === 'string') {
      if (pageTitle.trim() === '') {
        finalTitle = defaultTitle
      } else if (template && template.includes('%s')) {
        finalTitle = template.replace('%s', pageTitle)
      } else {
        finalTitle = pageTitle
      }
    } else if (typeof pageTitle === 'object' && pageTitle !== null) {
      finalTitle = defaultTitle
    } else if (!pageTitle) {
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
      if (key === 'title' || key === 'pageTitle' || key === 'canonical') return
      let selector = `meta[name='${key}']`
      if (key.startsWith('og:') || key.startsWith('twitter:')) {
        selector = `meta[property='${key}']`
      }
      let meta = document.head.querySelector(selector)
      if (!meta) {
        meta = document.createElement('meta')
        if (key.startsWith('og:') || key.startsWith('twitter:')) {
          meta.setAttribute('property', key)
        } else {
          meta.setAttribute('name', key)
        }
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', value)
    })
  }, [JSON.stringify(tags), JSON.stringify(options)])
}

/**
 * =============================
 * Ejemplos universales RyunixJS
 * =============================
 *
 * // SPA
 * import { render, init, RouterProvider, useRouter } from 'ryunix';
 * init(
 *   <RouterProvider routes={routes}>
 *     <App />
 *   </RouterProvider>
 * );
 *
 * // SSR
 * import { renderToString, RouterProvider } from 'ryunix';
 * const { html, head, data } = await renderToString(
 *   <RouterProvider routes={routes} ssrContext={{ location: '/about', query: { q: 'x' } }}>
 *     <App />
 *   </RouterProvider>
 * );
 * // Enviar html y head al cliente
 *
 * // SSG
 * import { renderToString, RouterProvider } from 'ryunix';
 * const { html, head, data } = await renderToString(
 *   <RouterProvider routes={routes} ssrContext={{ location: '/blog', query: {} }}>
 *     <App />
 *   </RouterProvider>
 * );
 * // Guardar html y head como archivos estáticos
 *
 * // Hidratación en cliente
 * import { hydrate, RouterProvider } from 'ryunix';
 * hydrate(
 *   <RouterProvider routes={routes}>
 *     <App />
 *   </RouterProvider>,
 *   '__ryunix'
 * );
 *
 * // Metadatos avanzados
 * useMetadata({
 *   title: 'Mi página',
 *   description: 'Desc',
 *   script: '<script src="/analytics.js"></script>',
 *   style: '<style>body{background:#000}</style>',
 *   custom: '<!-- Bloque personalizado -->'
 * });
 *
 * // Obtención de datos universal
 * import { withSSRData, withSSGData } from 'ryunix';
 * export default withSSRData(App, async (ctx) => ({ user: await fetchUser(ctx.route) }))
 * export default withSSGData(App, async (ctx) => ({ posts: await fetchPosts() }))
 *
 * // Enrutamiento universal en componentes
 * import { useRouter } from 'ryunix';
 * const { location, params, query } = useRouter();
 */

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
  //seo
  useMetadata,
}
